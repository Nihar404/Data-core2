// Firebase Configuration
// IMPORTANT: Replace these values with your own Firebase project credentials
// Get these from: Firebase Console > Project Settings > General > Your apps > Web app

const firebaseConfig = {
    // TODO: Replace with your Firebase project configuration
    // You can get this from Firebase Console after creating a project
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Instructions to get your config:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project or select existing
// 3. Go to Project Settings (gear icon)
// 4. Scroll to "Your apps" section
// 5. Click Web (</>) icon to add web app
// 6. Copy the firebaseConfig object shown
// 7. Paste it above, replacing the placeholder values

// Example of what your actual config will look like:
/*
const firebaseConfig = {
    apiKey: "AIzaSyAbc123XYZ...",
    authDomain: "data-bhandaar.firebaseapp.com",
    projectId: "data-bhandaar",
    storageBucket: "data-bhandaar.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456"
};
*/

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.firebaseConfig = firebaseConfig;
}
