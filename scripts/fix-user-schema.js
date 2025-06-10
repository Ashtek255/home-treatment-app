// Script to fix user document schema and add missing profile picture fields
import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function fixUserSchema() {
  try {
    console.log("🔍 Checking user document schema...")

    // Get all users
    const usersSnapshot = await getDocs(collection(db, "users"))
    console.log(`📊 Found ${usersSnapshot.size} user documents`)

    if (usersSnapshot.size === 0) {
      console.log("❌ No user documents found!")
      return
    }

    // Check first user document structure
    const firstUser = usersSnapshot.docs[0]
    const userData = firstUser.data()
    console.log("📋 Sample user document structure:")
    console.log("Fields:", Object.keys(userData))

    // Check for profile picture fields
    const hasPhotoUrl = userData.hasOwnProperty("photoUrl")
    const hasProfilePicture = userData.hasOwnProperty("profilePicture")

    console.log(`📸 Profile picture fields:`)
    console.log(`  - photoUrl: ${hasPhotoUrl ? "✅ Present" : "❌ Missing"}`)
    console.log(`  - profilePicture: ${hasProfilePicture ? "✅ Present" : "❌ Missing"}`)

    let updateCount = 0
    let errorCount = 0

    console.log("\n🔧 Updating user documents...")

    for (const userDoc of usersSnapshot.docs) {
      try {
        const userData = userDoc.data()
        const updates = {}

        // Add missing photoUrl field
        if (!userData.hasOwnProperty("photoUrl")) {
          updates.photoUrl = userData.profilePicture || ""
        }

        // Add missing profilePicture field
        if (!userData.hasOwnProperty("profilePicture")) {
          updates.profilePicture = userData.photoUrl || ""
        }

        // Add updatedAt timestamp
        updates.updatedAt = new Date().toISOString()

        // Only update if there are changes
        if (Object.keys(updates).length > 1) {
          // More than just updatedAt
          await updateDoc(doc(db, "users", userDoc.id), updates)
          updateCount++
          console.log(`✅ Updated user ${userDoc.id} (${userData.email || userData.fullName || "Unknown"})`)
        }
      } catch (error) {
        errorCount++
        console.error(`❌ Failed to update user ${userDoc.id}:`, error.message)
      }
    }

    console.log("\n📊 Schema update summary:")
    console.log(`  - Total users: ${usersSnapshot.size}`)
    console.log(`  - Updated: ${updateCount}`)
    console.log(`  - Errors: ${errorCount}`)
    console.log(`  - Skipped: ${usersSnapshot.size - updateCount - errorCount}`)

    // Verify the updates
    console.log("\n🔍 Verifying updates...")
    const verifyDoc = await getDoc(doc(db, "users", firstUser.id))
    if (verifyDoc.exists()) {
      const verifyData = verifyDoc.data()
      console.log("✅ Verification successful:")
      console.log(`  - photoUrl: ${verifyData.hasOwnProperty("photoUrl") ? "✅" : "❌"}`)
      console.log(`  - profilePicture: ${verifyData.hasOwnProperty("profilePicture") ? "✅" : "❌"}`)
    }

    console.log("\n🎉 User schema fix completed!")
  } catch (error) {
    console.error("💥 Error fixing user schema:", error)
    console.error("Error details:", error.message)
  }
}

// Run the schema fix
fixUserSchema()
