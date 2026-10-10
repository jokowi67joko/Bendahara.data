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

async function verifyAccess(key) {
  try {
    const q = query(collection(db, "members"), where("accessKey", "==", key));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const docData = docSnap.data();
      const role = (docData.role || "anggota").toLowerCase().trim();

      // Simpan session
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("userRole", role);
      sessionStorage.setItem("userName", docData.name || "Pengguna");
      sessionStorage.setItem("memberId", docSnap.id);

      // Pengalihan halaman berdasarkan role
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
    console.error("Login error:", err);
    showError("Terjadi kesalahan saat memverifikasi kode akses.");
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
      showError("Harap masukkan kode akses!");
    }
  });
}
