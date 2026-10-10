// Import Firebase SDK (menggunakan CDN versi modular v10 kompatibel)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-functions.js";
import { getAuth, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Ganti konfigurasi berikut dengan data dari Firebase Console Anda
const firebaseConfig = {
  apiKey: "AIzaSyBm_xQdGCe9zg3lVIwgPOBonAwt9eOzfiY",
  authDomain: "data-base-267b0.firebaseapp.com",
  projectId: "data-base-267b0",
  storageBucket: "data-base-267b0.firebasestorage.app",
  messagingSenderId: "302140233352",
  appId: "1:302140233352:web:e63b5f774374e5d9aa713d"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app);
const auth = getAuth(app);

export { db, functions, auth, signInWithCustomToken, httpsCallable };
