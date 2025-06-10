// This script checks Firebase Storage configuration and permissions
const { initializeApp } = require("firebase/app")
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require("firebase/storage")

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

async function checkFirebaseStorage() {
  console.log("Checking Firebase Storage configuration...")
  console.log("Firebase config:", {
    apiKey: firebaseConfig.apiKey ? "✓ Set" : "✗ Missing",
    authDomain: firebaseConfig.authDomain ? "✓ Set" : "✗ Missing",
    projectId: firebaseConfig.projectId ? "✓ Set" : "✗ Missing",
    storageBucket: firebaseConfig.storageBucket ? "✓ Set" : "✗ Missing",
    messagingSenderId: firebaseConfig.messagingSenderId ? "✓ Set" : "✗ Missing",
    appId: firebaseConfig.appId ? "✓ Set" : "✗ Missing",
  })

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig)
    console.log("Firebase app initialized successfully")

    // Initialize Storage
    const storage = getStorage(app)
    console.log("Firebase Storage initialized successfully")
    console.log("Storage bucket:", storage.app.options.storageBucket)

    // Create a test file
    const testData = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x57, 0x6f, 0x72, 0x6c, 0x64])
    const testFilePath = `test/storage-test-${Date.now()}.txt`
    const testFileRef = ref(storage, testFilePath)

    console.log("Attempting to upload test file...")
    const snapshot = await uploadBytes(testFileRef, testData)
    console.log("Test file uploaded successfully!")

    // Get download URL
    const downloadURL = await getDownloadURL(testFileRef)
    console.log("Download URL obtained:", downloadURL)

    // Clean up - delete the test file
    await deleteObject(testFileRef)
    console.log("Test file deleted successfully")

    console.log("✅ Firebase Storage is properly configured and working!")
    return true
  } catch (error) {
    console.error("❌ Firebase Storage check failed:", error)
    console.error("Error code:", error.code)
    console.error("Error message:", error.message)

    // Provide specific guidance based on error
    if (error.code === "storage/unauthorized") {
      console.error("SOLUTION: Check your Firebase Storage rules. They might be too restrictive.")
    } else if (error.code === "storage/invalid-argument") {
      console.error("SOLUTION: Check your Firebase configuration, especially the storageBucket value.")
    } else if (error.code === "storage/unknown") {
      console.error(
        "SOLUTION: This might be a network issue or CORS problem. Check your internet connection and Firebase CORS settings.",
      )
    }

    return false
  }
}

// Run the check
checkFirebaseStorage().then((success) => {
  if (success) {
    console.log("Firebase Storage check completed successfully")
  } else {
    console.log("Firebase Storage check failed - see errors above")
  }
})
