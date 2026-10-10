import { db } from "./firebase-config.js";
import { 
  doc, 
  collection, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Validasi Sesi & Proteksi Role
const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
const userRole = (sessionStorage.getItem("userRole") || "").trim().toLowerCase();
const userName = sessionStorage.getItem("userName") || "Anggota";
const memberId = sessionStorage.getItem("memberId");

// Jika belum login, tendang ke login
if (!isLoggedIn) {
  window.location.replace("index.html");
}

// Jika role admin atau bendahara masuk ke dashboard anggota, lempar ke admin.html
if (userRole === "admin" || userRole === "bendahara") {
  window.location.replace("admin.html");
}

// Tombol Logout
const logoutBtn = document.getElementById("logoutBtn") || document.querySelector("header button");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    sessionStorage.clear();
    window.location.replace("index.html");
  });
}

// 2. Real-time Saldo Kas & Banner Pengumuman
const totalSaldoElement = document.getElementById("totalSaldo");
const bannerContainer = document.getElementById("bannerContainer") || document.querySelector(".banner-box");

onSnapshot(doc(db, "settings", "general"), (docSnap) => {
  if (docSnap.exists()) {
    const data = docSnap.data();
    
    // Tampilkan total saldo
    if (totalSaldoElement) {
      const saldo = data.totalSaldo || 0;
      totalSaldoElement.textContent = "Rp " + saldo.toLocaleString("id-ID");
    }

    // Tampilkan banner jika ada URL gambar
    if (bannerContainer && data.bannerUrl) {
      bannerContainer.innerHTML = `<img src="${data.bannerUrl}" alt="Banner" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`;
    }
  }
});

// 3. Status Pembayaran Pribadi & Daftar Anggota Kelas
const membersContainer = document.getElementById("membersContainer");
const userStatusText = document.getElementById("userStatusText");
const searchMember = document.getElementById("searchMember");

let allMembers = [];

onSnapshot(collection(db, "members"), (snapshot) => {
  allMembers = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    data.id = docSnap.id;
    allMembers.push(data);
  });

  // Cek status pembayaran milik akun yang sedang login
  if (userStatusText) {
    const self = allMembers.find((m) => m.id === memberId || (m.name && m.name.toLowerCase() === userName.toLowerCase()));
    if (self) {
      const status = self.status || "Belum Lunas";
      userStatusText.textContent = status;
      userStatusText.style.color = status.toLowerCase() === "lunas" ? "#10b981" : "#ef4444";
    } else {
      userStatusText.textContent = "Terdaftar";
      userStatusText.style.color = "#94a3b8";
    }
  }

  renderMembersList(allMembers);
});

function renderMembersList(members) {
  if (!membersContainer) return;
  membersContainer.innerHTML = "";

  if (members.length === 0) {
    membersContainer.innerHTML = '<p style="color: #94a3b8; text-align: center; font-size: 0.85rem; padding: 12px;">Tidak ada data anggota.</p>';
    return;
  }

  members.forEach((member) => {
    const status = member.status || "Belum Lunas";
    const isLunas = status.toLowerCase() === "lunas";

    const badgeStyle = isLunas
      ? "background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4);"
      : "background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4);";

    const card = document.createElement("div");
    card.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: rgba(30, 41, 59, 0.6); padding: 12px 16px; border-radius: 12px; margin-bottom: 8px; border: 1px solid rgba(255, 255, 255, 0.05);";

    card.innerHTML = `
      <div>
        <div style="font-weight: 600; font-size: 0.95rem; color: #f8fafc;">${member.name || member.nama || "Tanpa Nama"}</div>
        <div style="font-size: 0.8rem; color: #94a3b8;">${member.role || "Anggota"}</div>
      </div>
      <span style="font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 20px; ${badgeStyle}">
        ${status}
      </span>
    `;

    membersContainer.appendChild(card);
  });
}

// Fitur Filter / Pencarian Anggota
if (searchMember) {
  searchMember.addEventListener("input", (e) => {
    const keyword = e.target.value.toLowerCase().trim();
    const filtered = allMembers.filter((m) => {
      const name = (m.name || m.nama || "").toLowerCase();
      return name.includes(keyword);
    });
    renderMembersList(filtered);
  });
}

// 4. Pengambilan Berita Terkini
async function loadNews() {
  const newsContainer = document.getElementById("newsContainer");
  if (!newsContainer) return;

  try {
    const response = await fetch("https://api-berita-indonesia.vercel.app/antara/terbaru/");
    const resData = await response.json();

    if (resData.success && resData.data.posts.length > 0) {
      const posts = resData.data.posts.slice(0, 4);
      newsContainer.innerHTML = "";

      posts.forEach((post) => {
        const item = document.createElement("div");
        item.style.cssText = "padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05);";
        item.innerHTML = `
          <a href="${post.link}" target="_blank" rel="noopener noreferrer" style="color: #e2e8f0; text-decoration: none; font-size: 0.85rem; font-weight: 500; display: block; line-height: 1.4;">
            ${post.title}
          </a>
          <span style="font-size: 0.7rem; color: #64748b;">${new Date(post.pubDate).toLocaleDateString("id-ID")}</span>
        `;
        newsContainer.appendChild(item);
      });
    } else {
      newsContainer.innerHTML = '<p style="color: #94a3b8; font-size: 0.85rem;">Tidak ada berita terkini.</p>';
    }
  } catch (err) {
    newsContainer.innerHTML = '<p style="color: #94a3b8; font-size: 0.85rem;">Gagal memuat berita terkini.</p>';
  }
}

loadNews();
