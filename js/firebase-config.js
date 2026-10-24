// Firebase project settings for cloud saves and shared champions.
// These values are public by design; the Firestore rules in firestore.rules are what protect the data.
// Set it to null to run without cloud features (progress stays on each device).
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyCOSaRb1eJxbpI8MZ8c1nLd5EzbzGjS-zQ",
  authDomain: "world-pending-deletion.firebaseapp.com",
  projectId: "world-pending-deletion",
  storageBucket: "world-pending-deletion.firebasestorage.app",
  messagingSenderId: "509931217809",
  appId: "1:509931217809:web:1f075ca8514d998576f030"
};
// Sign-in buttons to show. Add 'github' once the GitHub provider is enabled in the Firebase console.
window.FIREBASE_PROVIDERS = ['google'];
