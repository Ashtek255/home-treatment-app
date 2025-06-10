// This file is for reference only - you'll need to update these rules in your Firebase console

// Firestore Rules
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own data
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'admin');
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'admin');
    }
    
    // Chat messages
    match /chats/{chatId}/messages/{messageId} {
      allow read: if request.auth != null && chatId.split('_').hasAny([request.auth.uid]);
      allow create: if request.auth != null && chatId.split('_').hasAny([request.auth.uid]);
      allow update: if request.auth != null && chatId.split('_').hasAny([request.auth.uid]);
      allow delete: if request.auth != null && request.resource.data.senderId == request.auth.uid;
    }
  }
}
*/

// Storage Rules
/*
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow users to read and write their own files
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow doctors to upload their files
    match /doctors/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow pharmacies to upload their files
    match /pharmacies/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Chat files
    match /chats/{chatId}/{allPaths=**} {
      allow read: if request.auth != null && chatId.split('_').hasAny([request.auth.uid]);
      allow write: if request.auth != null && chatId.split('_').hasAny([request.auth.uid]);
    }
  }
}
*/
