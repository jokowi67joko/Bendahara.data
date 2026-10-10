import { db } from "./firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const accessKeyInput = document.getElementById("accessKey");
const errorMessage = document.getElementById("errorMessage");

function showError(msg) {
  if (errorMessage) {
    errorMessage.textContent = msg;
    errorMessage.style.display = "block";
  } else {
    alert(msg);
  }
}

async function verifyAccess(inputKey) {
  try {
    // 1. Padankan dengan koleksi 'access_codes' dan field 'key' seperti dalam Firebase
    const q = query(
      collection(db, "access_codes"), 
      where("key", "==", inputKey)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const docData = docSnap.data();

      // Ambil peranan pengguna (admin, bendahara, atau default anggota)
      const role = (docData.role || "anggota").toLowerCase().trim();
      const name = docData.name || docData.username || "Pengguna";

      // Simpan maklumat sesi
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("userRole", role);
      sessionStorage.setItem("userName", name);
      sessionStorage.setItem("memberId", docSnap.id);

      // Pengalihan halaman mengikut peranan
      if (role === "admin" || role === "bendahara") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "dashboard.html";
      }
      return true;
    }

    showError("Kode akses tidak valid!");
    return false;
  } catch (err) {
    console.error("Ralat log masuk:", err);
    showError("Ralat sambungan pangkalan data: " + err.message);
    return false;
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const key = accessKeyInput ? accessKeyInput.value.trim() : "";
    if (key) {
      await verifyAccess(key);
    } else {
      showError("Sila masukkan kod akses!");
    }
  });
}
