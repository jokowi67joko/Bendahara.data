import { db } from "./firebase-config.js";
import { doc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Validasi Sesi Pengguna
const userRole = (sessionStorage.getItem("userRole") || "").toLowerCase().trim();
const userName = sessionStorage.getItem("userName") || "Anggota";
const memberId = sessionStorage.getItem("memberId");
const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";

// Jika belum login, tendang ke login
if (!isLoggedIn) {
  window.location.href = "index.html";
}

// Jika role admin atau bendahara membuka dashboard.html, alihkan ke admin.html
if (userRole === "admin" || userRole === "bendahara") {
  window.location.href = "admin.html";
}

// Tampilkan salam
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

// 2. Real-time Saldo Kas Kelas
onSnapshot(doc(db, "settings", "general"), (docSnap) => {
  if (docSnap.exists()) {
    const saldo = docSnap.data().totalSaldo || 0;
    const totalSaldoElement = document.getElementById("totalSaldo");
    if (totalSaldoElement) {
      totalSaldoElement.textContent = "Rp " + saldo.toLocaleString("id-ID");
    }
  }
});

// 3. Status Diri Sendiri & Daftar Anggota
const membersContainer = document.getElementById("membersContainer");
const userStatusText = document.getElementById("userStatusText");
const searchMember = document.getElementById("searchMember");

let allMembers = [];

onSnapshot(collection(db, "members"), (snapshot) => {
  allMembers = [];
  snapshot.forEach((docSnap) => {
    const d = docSnap.data();
    d.id = docSnap.id;
    allMembers.push(d);
  });

  // Cek status bayar akun yang sedang login
  if (memberId) {
    const self = allMembers.find((m) => m.id === memberId || m.name === userName);
    if (self && userStatusText) {
      userStatusText.textContent = self.status || "Belum Lunas";
      userStatusText.style.color = self.status === "Belum Lunas" ? "#ef4444" : "#10b981";
    }
  }

  renderMembersList(allMembers);
});

function renderMembersList(members) {
  if (!membersContainer) return;
  membersContainer.innerHTML = "";

  if (members.length === 0) {
    membersContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; font-size: 0.9rem;">Tidak ada anggota ditemukan.</p>';
    return;
  }

  members.forEach((member) => {
    const card = document.createElement("div");
    card.className = "member-card";
    card.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: var(--bg-card); padding: 12px 16px; border-radius: 12px; margin-bottom: 8px; border: 1px solid var(--border-color);";

    const isLunas = (member.status || "Belum Lunas") === "Lunas";
    const badgeStyle = isLunas
      ? "background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid #10b981;"
      : "background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid #ef4444;";

    card.innerHTML = `
      <div>
        <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-main);">${member.name || "Tanpa Nama"}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">${member.role || "Anggota"}</div>
      </div>
      <span style="font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 20px; ${badgeStyle}">
        ${member.status || "Belum Lunas"}
      </span>
    `;
    membersContainer.appendChild(card);
  });
}

// Fitur Cari Anggota
if (searchMember) {
  searchMember.addEventListener("input", (e) => {
    const keyword = e.target.value.toLowerCase();
    const filtered = allMembers.filter((m) =>
      (m.name || "").toLowerCase().includes(keyword)
    );
    renderMembersList(filtered);
  });
}

// 4. Fetch Berita Publik
async function fetchNews() {
  const newsContainer = document.getElementById("newsContainer");
  if (!newsContainer) return;

  try {
    const res = await fetch("https://api-berita-indonesia.vercel.app/antara/terbaru/");
    const json = await res.json();
    const articles = json.data.posts.slice(0, 5);

    newsContainer.innerHTML = "";
    articles.forEach((art) => {
      const item = document.createElement("div");
      item.style.cssText = "padding: 10px 0; border-bottom: 1px solid var(--border-color);";
      item.innerHTML = `
        <a href="${art.link}" target="_blank" rel="noopener noreferrer" style="color: var(--text-main); text-decoration: none; font-weight: 500; font-size: 0.9rem; display: block; margin-bottom: 4px;">
          ${art.title}
        </a>
        <span style="font-size: 0.75rem; color: var(--text-muted);">${new Date(art.pubDate).toLocaleDateString("id-ID")}</span>
      `;
      newsContainer.appendChild(item);
    });
  } catch (err) {
    if (newsContainer) {
      newsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">Gagal memuat berita terkini.</p>';
    }
  }
}

fetchNews();
