"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { getFirebaseAuth, getFirebaseFirestore } from "@/lib/firebase"

type UserType = "patient" | "doctor" | "pharmacy" | "admin"

interface UserData {
  uid: string
  email: string | null
  userType: UserType
  displayName?: string
  phoneNumber?: string
  profileCompleted?: boolean
  fullName?: string
  photoUrl?: string
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  signup: (email: string, password: string, userType: UserType) => Promise<User>
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserData: (data: Partial<UserData>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  // Set isClient to true when component mounts on client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Session management
  useEffect(() => {
    if (!isClient || !user) return

    const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes

    const checkSession = () => {
      const lastActivity = localStorage.getItem("lastActivity")
      if (lastActivity && Date.now() - Number.parseInt(lastActivity) > SESSION_TIMEOUT) {
        // Session expired
        logout()
        // You can show a toast here if you have a toast context
        console.log("Session expired due to inactivity")
      }
    }

    const updateActivity = () => {
      localStorage.setItem("lastActivity", Date.now().toString())
    }

    // Check session every minute
    const sessionInterval = setInterval(checkSession, 60000)

    // Update activity on user interaction
    const events = ["click", "keypress", "scroll", "mousemove"]
    events.forEach((event) => {
      window.addEventListener(event, updateActivity)
    })

    // Set initial activity
    updateActivity()

    return () => {
      clearInterval(sessionInterval)
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity)
      })
    }
  }, [isClient, user])

  // Rest of the existing useEffect and functions remain the same...
  useEffect(() => {
    // Only run this effect on the client side
    if (!isClient) {
      setLoading(false)
      return () => {}
    }

    let unsubscribe = () => {}

    try {
      const auth = getFirebaseAuth()
      const db = getFirebaseFirestore()

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log("Auth state changed:", user ? `User ${user.uid} logged in` : "User logged out")
        setUser(user)

        if (user) {
          // Fetch additional user data from Firestore
          try {
            console.log("Fetching user data for:", user.uid)
            const userDocRef = doc(db, "users", user.uid)
            const userDoc = await getDoc(userDocRef)

            if (userDoc.exists()) {
              const userData = { uid: user.uid, ...userDoc.data() } as UserData
              console.log("User data fetched:", userData)
              setUserData(userData)
            } else {
              console.log("No user data found in Firestore")
            }
          } catch (error) {
            console.error("Error fetching user data:", error)
          }
        } else {
          setUserData(null)
          // Clear session data on logout
          localStorage.removeItem("lastActivity")
        }

        setLoading(false)
      })
    } catch (error) {
      console.error("Error setting up auth state listener:", error)
      setLoading(false)
    }

    return () => {
      try {
        unsubscribe()
      } catch (error) {
        console.error("Error unsubscribing from auth state:", error)
      }
    }
  }, [isClient])

  // Enhanced signup with better error handling
  const signup = async (email: string, password: string, userType: UserType) => {
    try {
      const auth = getFirebaseAuth()
      const db = getFirebaseFirestore()

      console.log(`Signing up user with email: ${email}, userType: ${userType}`)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      console.log("User created successfully:", user.uid)

      // Create user document in Firestore
      console.log("Creating user document in Firestore")
      await setDoc(doc(db, "users", user.uid), {
        email,
        userType,
        createdAt: new Date().toISOString(),
        profileCompleted: userType === "admin" ? true : false,
        lastLoginAt: new Date().toISOString(),
      })
      console.log("User document created successfully")

      return user
    } catch (error) {
      console.error("Error during signup:", error)
      throw error
    }
  }

  // Enhanced login with activity tracking
  const login = async (email: string, password: string) => {
    try {
      const auth = getFirebaseAuth()
      const db = getFirebaseFirestore()

      console.log(`Logging in user with email: ${email}`)
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log("User logged in successfully:", userCredential.user.uid)

      // Update last login time
      await setDoc(
        doc(db, "users", userCredential.user.uid),
        {
          lastLoginAt: new Date().toISOString(),
        },
        { merge: true },
      )

      // Fetch user data immediately after login
      const userDocRef = doc(db, "users", userCredential.user.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const userData = { uid: userCredential.user.uid, ...userDoc.data() } as UserData
        setUserData(userData)
      } else {
        console.warn("User document not found in Firestore after login")
      }

      return userCredential.user
    } catch (error) {
      console.error("Error during login:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      const auth = getFirebaseAuth()

      console.log("Logging out user")
      await signOut(auth)

      // Clear session data
      localStorage.removeItem("lastActivity")

      console.log("User logged out successfully")
    } catch (error) {
      console.error("Error during logout:", error)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const auth = getFirebaseAuth()

      console.log(`Sending password reset email to: ${email}`)
      await sendPasswordResetEmail(auth, email)
      console.log("Password reset email sent successfully")
    } catch (error) {
      console.error("Error sending password reset email:", error)
      throw error
    }
  }

  const updateUserData = async (data: Partial<UserData>) => {
    if (!user) throw new Error("No authenticated user")

    try {
      const db = getFirebaseFirestore()

      console.log(`Updating user data for: ${user.uid}`, data)
      const userDocRef = doc(db, "users", user.uid)
      await setDoc(
        userDocRef,
        {
          ...data,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      )
      console.log("User data updated successfully")

      // Update local state
      setUserData((prev) => (prev ? { ...prev, ...data } : null))
      return true
    } catch (error) {
      console.error("Error updating user data:", error)
      throw error
    }
  }

  const value = {
    user,
    userData,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    updateUserData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
