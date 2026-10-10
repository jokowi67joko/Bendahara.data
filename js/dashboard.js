import { db } from "./firebase-config.js";
import { doc, getDoc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Cek sesi login (semua role diizinkan)
const userRole = sessionStorage.getItem("userRole");
const userName = sessionStorage.getItem("userName") || sessionStorage.getItem("name") || "Pengguna";
const memberId = sessionStorage.getItem("memberId") || sessionStorage.getItem("accessKey");

// Cek apakah ada sesi login aktif
const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true" || userRole !== null;

if (!isLoggedIn) {
  window.location.href = "index.html";
}

// Tampilkan nama pengguna di header/sapaan
const userGreeting = document.getElementById("userGreeting") || document.getElementById("userName");
if (userGreeting) {
  userGreeting.textContent = `Halo, ${userName}`;
}

// Tombol Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "index.html";
  });
}

document.getElementById("welcomeTitle").textContent = `Halo, ${userName}`;
document.getElementById("myNameText").textContent = userName;

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.clear();
  window.location.href = "index.html";
});

// Load Saldo Kas Real-time
onSnapshot(doc(db, "kas", "saldo"), (docSnap) => {
  if (docSnap.exists()) {
    const saldo = docSnap.data().nominal || 0;
    document.getElementById("totalSaldo").textContent = "Rp " + saldo.toLocaleString("id-ID");
  }
});

// Load Daftar Anggota & Status Diri Sendiri (Real-time)
const memberListContainer = document.getElementById("memberListContainer");
const myStatusBadge = document.getElementById("myStatusBadge");
const searchMember = document.getElementById("searchMember");
let allMembers = [];

function renderDashboardMembers(filter = "") {
  memberListContainer.innerHTML = "";
  const filtered = allMembers.filter(m => m.nama.toLowerCase().includes(filter.toLowerCase()));

  if (filtered.length === 0) {
    memberListContainer.innerHTML = `<p style="color: var(--text-muted); text-align: center; font-size: 0.9rem;">Tidak ada anggota ditemukan.</p>`;
    return;
  }

  filtered.forEach(m => {
    const card = document.createElement("div");
    card.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: var(--bg-color); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color);";
    
    card.innerHTML = `
      <span style="font-size: 0.95rem; font-weight: 500;">${m.nama}</span>
      <div>
        ${m.sudahBayar ? '<span class="badge badge-success">Lunas</span>' : '<span class="badge badge-danger">Belum Bayar</span>'}
      </div>
    `;
    memberListContainer.appendChild(card);
  });
}

onSnapshot(collection(db, "anggota"), (snapshot) => {
  allMembers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Update status diri sendiri
  const me = allMembers.find(m => m.id === memberId);
  if (me) {
    if (me.sudahBayar) {
      myStatusBadge.innerHTML = '<span class="badge badge-success" style="font-size: 0.9rem; padding: 6px 14px;">Lunas Periode Ini</span>';
    } else {
      myStatusBadge.innerHTML = '<span class="badge badge-danger" style="font-size: 0.9rem; padding: 6px 14px;">Belum Bayar</span>';
    }
  }

  renderDashboardMembers(searchMember.value);
});

searchMember.addEventListener("input", (e) => {
  renderDashboardMembers(e.target.value);
});

// Fetch Berita Publik (Contoh dari Dummy API / News API publik)
async function fetchNews() {
  const newsContainer = document.getElementById("newsContainer");
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=3");
    const articles = await response.json();
    
    newsContainer.innerHTML = "";
    articles.forEach(art => {
      const item = document.createElement("div");
      item.style.cssText = "margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--border-color);";
      item.innerHTML = `<strong style="color: var(--text-color); display: block; font-size: 0.9rem; text-transform: capitalize;">${art.title}</strong>
                        <p style="font-size: 0.8rem; margin-top: 2px; color: var(--text-muted);">${art.body.substring(0, 80)}...</p>`;
      newsContainer.appendChild(item);
    });
  } catch (err) {
    newsContainer.innerHTML = "Gagal memuat berita terkini.";
  }
}
fetchNews();
