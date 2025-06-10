// Script to add photoUrl field to existing user documents
import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore"

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

async function updateUserSchema() {
  try {
    console.log("Starting user schema update...")

    // Get all users
    const usersSnapshot = await getDocs(collection(db, "users"))
    console.log(`Found ${usersSnapshot.size} users to update`)

    let updateCount = 0

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data()

      // Check if photoUrl field is missing
      if (!userData.photoUrl) {
        await updateDoc(doc(db, "users", userDoc.id), {
          photoUrl: userData.profilePicture || "", // Use existing profilePicture or empty string
          updatedAt: new Date().toISOString(),
        })
        updateCount++
        console.log(`Updated user ${userDoc.id}`)
      }
    }

    console.log(`Schema update completed. Updated ${updateCount} users.`)
  } catch (error) {
    console.error("Error updating user schema:", error)
  }
}

updateUserSchema()
