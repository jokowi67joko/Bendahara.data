import { auth, signInWithCustomToken } from "./firebase-config.js";

let attemptCount = 0;
let isLocked = false;
let lockTimer = null;

const loginForm = document.getElementById("loginForm");
const accessKeyInput = document.getElementById("accessKey");
const errorMsg = document.getElementById("errorMsg");
const loginBtn = document.getElementById("loginBtn");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isLocked) return;

    const key = accessKeyInput.value.trim();
    if (!key) return;

    loginBtn.disabled = true;
    loginBtn.textContent = "Memeriksa...";
    errorMsg.style.display = "none";

    try {
      // Panggil serverless function Vercel
      const response = await fetch("/api/verifyKey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key })
      });
      const data = await response.json();

      if (data.success) {
        await signInWithCustomToken(auth, data.token);

        sessionStorage.setItem("userRole", data.role);
        sessionStorage.setItem("userName", data.name || "Admin");
        sessionStorage.setItem("memberId", data.memberId || "");

        if (data.role === "admin") {
          window.location.href = "admin.html";
        } else {
          window.location.href = "dashboard.html";
        }
      } else {
        handleFailedAttempt(data.message || "Kode akses salah.");
      }
    } catch (err) {
      console.error(err);
      handleFailedAttempt("Gagal terhubung ke server atau masalah jaringan.");
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Masuk";
    }
  });
}

function handleFailedAttempt(message) {
  attemptCount++;
  errorMsg.textContent = message;
  errorMsg.style.display = "block";

  if (attemptCount >= 3) {
    isLocked = true;
    let cooldown = 10;
    accessKeyInput.disabled = true;
    loginBtn.disabled = true;

    errorMsg.textContent = `Terlalu banyak percobaan salah. Coba lagi dalam ${cooldown} detik.`;

    lockTimer = setInterval(() => {
      cooldown--;
      if (cooldown > 0) {
        errorMsg.textContent = `Terlalu banyak percobaan salah. Coba lagi dalam ${cooldown} detik.`;
      } else {
        clearInterval(lockTimer);
        isLocked = false;
        attemptCount = 0;
        accessKeyInput.disabled = false;
        loginBtn.disabled = false;
        errorMsg.style.display = "none";
      }
    }, 1000);
  }
}
