import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Konfigurasi Firebase dari proyek database kamu
const firebaseConfig = {
  apiKey: "AIzaSyBm_xQd6Ce2zg3tVIwgPOBon",
  authDomain: "data-base-267b0.firebaseapp.com",
  projectId: "data-base-267b0",
  storageBucket: "data-base-267b0.firebasestorage.app",
  messagingSenderId: "302140233352",
  appId: "1:302140233352:web:e63b5f774374e5d9aa713d"
};

// Inisialisasi Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Selektor elemen sesuai HTML index
const loginForm = document.getElementById("loginForm");
const accessKeyInput = document.getElementById("accessKey");
const loginBtn = document.getElementById("loginBtn");
const errorMsg = document.getElementById("errorMsg");

function showError(msg) {
  if (errorMsg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = "block";
  }
}

function hideError() {
  if (errorMsg) {
    errorMsg.textContent = "";
    errorMsg.style.display = "none";
  }
}

// Fungsi verifikasi kode akses
async function verifyAccessCode(inputCode) {
  try {
    const q = query(
      collection(db, "access_codes"),
      where("key", "==", inputCode)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      sessionStorage.setItem("isLoggedIn", "true");
      // Arahkan ke file dashboard kamu
      window.location.href = "dashboard.html";
      return true;
    } else {
      showError("Kode akses salah. Silakan coba lagi.");
      return false;
    }
  } catch (error) {
    console.error("Firebase Error:", error);
    showError("Gagal terhubung ke server atau masalah jaringan.");
    return false;
  }
}

// Event handler submit form
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    const enteredCode = accessKeyInput ? accessKeyInput.value.trim() : "";

    if (!enteredCode) {
      showError("Masukkan kode akses terlebih dahulu!");
      return;
    }

    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.textContent = "Memeriksa...";
    }

    await verifyAccessCode(enteredCode);

    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = "Masuk";
    }
  });
}
