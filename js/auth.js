import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Inisialisasi Firestore (pastikan app firebase sudah di-init)
const db = getFirestore();

// Fungsi validasi kode akses
async function verifyAccessCode(inputCode) {
  try {
    // Cari dokumen di koleksi access_codes yang field 'key'-nya cocok
    const q = query(
      collection(db, "access_codes"),
      where("key", "==", inputCode)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Kode cocok
      alert("Login berhasil!");
      // Tambahkan logika redirect ke halaman utama jika diperlukan
      // window.location.href = "dashboard.html";
      return true;
    } else {
      // Kode tidak ditemukan
      alert("Kode akses salah!");
      return false;
    }
  } catch (error) {
    console.error("Error verifikasi kode:", error);
    alert("Terjadi kesalahan saat memeriksa kode.");
    return false;
  }
}

// Event listener tombol login
const loginBtn = document.getElementById("loginBtn");
const codeInput = document.getElementById("accessCodeInput");

if (loginBtn && codeInput) {
  loginBtn.addEventListener("click", async () => {
    const enteredCode = codeInput.value.trim();

    if (!enteredCode) {
      alert("Masukkan kode akses terlebih dahulu!");
      return;
    }

    await verifyAccessCode(enteredCode);
  });
}
