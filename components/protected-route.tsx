"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedUserTypes?: string[]
}

export function ProtectedRoute({ children, allowedUserTypes }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, userData, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not authenticated, redirect to login
        router.push("/login")
      } else if (userData) {
        // Check if user type is valid
        const validUserTypes = ["patient", "doctor", "pharmacy", "admin"]
        if (!validUserTypes.includes(userData.userType)) {
          // Invalid user type, redirect to home
          router.push("/")
          return
        }

        // Check if user type is allowed for this route
        if (allowedUserTypes && !allowedUserTypes.includes(userData.userType)) {
          // User type not allowed, redirect to their dashboard
          console.log(`User type ${userData.userType} not allowed, redirecting to dashboard`)
          if (userData.userType === "admin") {
            router.push("/dashboard/admin")
          } else {
            router.push(`/dashboard/${userData.userType}`)
          }
        }
      }
    }
  }, [user, userData, loading, router, allowedUserTypes])

  if (loading || !user || (allowedUserTypes && userData && !allowedUserTypes.includes(userData.userType))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
