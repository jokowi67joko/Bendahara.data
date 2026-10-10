import { db } from "./firebase-config.js";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Validasi Sesi Khusus Admin & Bendahara
const userRole = (sessionStorage.getItem("userRole") || "").toLowerCase().trim();
const userName = sessionStorage.getItem("userName") || "Admin";
const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";

if (!isLoggedIn || (userRole !== "admin" && userRole !== "bendahara")) {
  window.location.href = "index.html";
}

// Sapaan Admin / Bendahara
const userGreeting = document.getElementById("userGreeting") || document.getElementById("userName");
if (userGreeting) {
  userGreeting.textContent = `Halo, ${userName} (${userRole.toUpperCase()})`;
}

// Tombol Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "index.html";
  });
}

// 2. Real-time Saldo Kas & Update Saldo
let currentSaldo = 0;
const totalSaldoElement = document.getElementById("totalSaldo");

onSnapshot(doc(db, "settings", "general"), (docSnap) => {
  if (docSnap.exists()) {
    currentSaldo = docSnap.data().totalSaldo || 0;
  } else {
    currentSaldo = 0;
  }
  if (totalSaldoElement) {
    totalSaldoElement.textContent = "Rp " + currentSaldo.toLocaleString("id-ID");
  }
});

// 3. Form Pengeluaran Kas
const expenseForm = document.getElementById("expenseForm");
if (expenseForm) {
  expenseForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const amountInput = document.getElementById("expenseAmount");
    const descInput = document.getElementById("expenseDesc");

    const amount = Number(amountInput.value);
    const desc = descInput.value.trim();

    if (amount <= 0 || !desc) {
      alert("Harap isi nominal dan keperluan pengeluaran dengan benar.");
      return;
    }

    try {
      await addDoc(collection(db, "expenses"), {
        amount: amount,
        description: desc,
        createdBy: userName,
        createdAt: new Date().toISOString()
      });

      // Potong saldo total kas
      const newSaldo = Math.max(0, currentSaldo - amount);
      await setDoc(doc(db, "settings", "general"), { totalSaldo: newSaldo }, { merge: true });

      alert("Pengeluaran berhasil dicatat!");
      expenseForm.reset();
    } catch (err) {
      console.error("Gagal simpan pengeluaran:", err);
      alert("Gagal menyimpan pengeluaran.");
    }
  });
}

// 4. Form Tambah Anggota Baru
const addMemberForm = document.getElementById("addMemberForm");
const generateKeyBtn = document.getElementById("generateKeyBtn");
const accessKeyInput = document.getElementById("accessKey");

if (generateKeyBtn && accessKeyInput) {
  generateKeyBtn.addEventListener("click", () => {
    const randomKey = "KEY-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    accessKeyInput.value = randomKey;
  });
}

if (addMemberForm) {
  addMemberForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById("memberName");
    const roleInput = document.getElementById("memberRole");
    const keyInput = document.getElementById("accessKey");

    const name = nameInput.value.trim();
    const role = roleInput ? roleInput.value : "anggota";
    const accessKey = keyInput ? keyInput.value.trim() : "";

    if (!name || !accessKey) {
      alert("Nama dan kode akses wajib diisi!");
      return;
    }

    try {
      await addDoc(collection(db, "members"), {
        name: name,
        role: role,
        accessKey: accessKey,
        status: "Belum Lunas",
        createdAt: new Date().toISOString()
      });

      alert("Anggota berhasil ditambahkan!");
      addMemberForm.reset();
    } catch (err) {
      console.error("Gagal tambah anggota:", err);
      alert("Gagal menambahkan anggota.");
    }
  });
}

// 5. Daftar Anggota & Manajemen Status Iuran (Real-time)
const membersContainer = document.getElementById("membersContainer");
const searchMember = document.getElementById("searchMember");
let allMembers = [];

onSnapshot(collection(db, "members"), (snapshot) => {
  allMembers = [];
  snapshot.forEach((docSnap) => {
    const d = docSnap.data();
    d.id = docSnap.id;
    allMembers.push(d);
  });
  renderAdminMembers(allMembers);
});

function renderAdminMembers(members) {
  if (!membersContainer) return;
  membersContainer.innerHTML = "";

  if (members.length === 0) {
    membersContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Tidak ada data anggota.</p>';
    return;
  }

  members.forEach((m) => {
    const isLunas = (m.status || "Belum Lunas") === "Lunas";
    const card = document.createElement("div");
    card.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: var(--bg-card); padding: 12px 16px; border-radius: 12px; margin-bottom: 8px; border: 1px solid var(--border-color);";

    card.innerHTML = `
      <div>
        <div style="font-weight: 600; color: var(--text-main);">${m.name}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">Role: ${m.role || "anggota"} | Key: ${m.accessKey || "-"}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <button class="toggle-status-btn" data-id="${m.id}" data-current="${m.status || "Belum Lunas"}" style="padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; cursor: pointer; border: none; font-weight: 600; ${isLunas ? "background: rgba(16, 185, 129, 0.2); color: #10b981;" : "background: rgba(239, 68, 68, 0.2); color: #ef4444;"}">
          ${m.status || "Belum Lunas"}
        </button>
        <button class="delete-btn" data-id="${m.id}" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px;">
          <i class="fa fa-trash"></i>
        </button>
      </div>
    `;

    // Toggle status lunas / belum lunas
    const toggleBtn = card.querySelector(".toggle-status-btn");
    toggleBtn.addEventListener("click", async () => {
      const nextStatus = toggleBtn.getAttribute("data-current") === "Lunas" ? "Belum Lunas" : "Lunas";
      try {
        await updateDoc(doc(db, "members", m.id), { status: nextStatus });
      } catch (err) {
        alert("Gagal mengubah status!");
      }
    });

    // Hapus anggota
    const delBtn = card.querySelector(".delete-btn");
    delBtn.addEventListener("click", async () => {
      if (confirm(`Hapus anggota "${m.name}"?`)) {
        try {
          await deleteDoc(doc(db, "members", m.id));
        } catch (err) {
          alert("Gagal menghapus anggota!");
        }
      }
    });

    membersContainer.appendChild(card);
  });
}

// Fitur Cari
if (searchMember) {
  searchMember.addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase();
    const filtered = allMembers.filter((m) => (m.name || "").toLowerCase().includes(val));
    renderAdminMembers(filtered);
  });
}
