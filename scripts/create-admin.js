// Admin Setup Script
// Run this once to create your admin account

import { initializeApp } from "firebase/app"
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"
import { getFirestore, doc, setDoc } from "firebase/firestore"

// Your Firebase config (replace with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

async function createAdminAccount() {
  try {
    // Admin credentials - CHANGE THESE!
    const adminEmail = "admin@healthcare.com"
    const adminPassword = "SecureAdmin123!"

    console.log("Creating admin account...")

    // Create admin user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword)
    const user = userCredential.user

    console.log("Admin user created with UID:", user.uid)

    // Create admin document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: adminEmail,
      userType: "admin",
      createdAt: new Date().toISOString(),
      profileCompleted: true,
      fullName: "System Administrator",
      isActive: true,
    })

    console.log("✅ Admin account created successfully!")
    console.log("📧 Email:", adminEmail)
    console.log("🔑 Password:", adminPassword)
    console.log("🚀 You can now login at /login")
  } catch (error) {
    console.error("❌ Error creating admin account:", error)
  }
}

// Run the function
createAdminAccount()
