import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, deleteDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Cek autentikasi sesi admin
if (sessionStorage.getItem("userRole") !== "admin") {
  window.location.href = "index.html";
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.clear();
  window.location.href = "index.html";
});

// Load Saldo Realtime
onSnapshot(doc(db, "kas", "saldo"), (docSnap) => {
  if (docSnap.exists()) {
    const saldo = docSnap.data().nominal || 0;
    document.getElementById("totalSaldo").textContent = "Rp " + saldo.toLocaleString("id-ID");
  }
});

// Load Pengaturan Kelas
const settingsForm = document.getElementById("settingsForm");
const classNameInput = document.getElementById("classNameInput");
const nominalInput = document.getElementById("nominalInput");
const intervalSelect = document.getElementById("intervalSelect");

async function loadSettings() {
  const docSnap = await getDoc(doc(db, "pengaturan", "kelas"));
  if (docSnap.exists()) {
    const data = docSnap.data();
    classNameInput.value = data.namaKelas || "";
    nominalInput.value = data.nominalBayar || 2000;
    intervalSelect.value = data.interval || "mingguan";
  }
}
loadSettings();

settingsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await setDoc(doc(db, "pengaturan", "kelas"), {
      namaKelas: classNameInput.value,
      nominalBayar: Number(nominalInput.value),
      interval: intervalSelect.value,
      updatedAt: serverTimestamp()
    }, { merge: true });
    alert("Pengaturan berhasil disimpan!");
  } catch (err) {
    console.error(err);
    alert("Gagal menyimpan pengaturan.");
  }
});

// Tambah Anggota & Generate Key Unik
const addMemberForm = document.getElementById("addMemberForm");
const memberNameInput = document.getElementById("memberNameInput");
const generatedKeyBox = document.getElementById("generatedKeyBox");
const newKeyText = document.getElementById("newKeyText");

addMemberForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = memberNameInput.value.trim();
  if (!name) return;

  // Generate random unique key (misal: mbr-XXXXXX)
  const uniqueKey = "key-" + Math.random().toString(36.substring(2, 9)) + Math.floor(1000 + Math.random() * 9000);

  try {
    // Tambah ke koleksi anggota
    const memberRef = await addDoc(collection(db, "anggota"), {
      nama: name,
      key: uniqueKey,
      sudahBayar: false,
      updatedAt: serverTimestamp()
    });

    newKeyText.textContent = uniqueKey;
    generatedKeyBox.style.display = "block";
    memberNameInput.value = "";
    loadMembers();
  } catch (err) {
    console.error(err);
    alert("Gagal menambahkan anggota.");
  }
});

// Load Daftar Anggota Realtime & Search
const memberListContainer = document.getElementById("memberListContainer");
const searchMember = document.getElementById("searchMember");
let allMembers = [];

function renderMembers(filter = "") {
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
      <div>
        <strong style="font-size: 0.95rem; display: block; margin-bottom: 4px;">${m.nama}</strong>
        ${m.sudahBayar ? '<span class="badge badge-success">Lunas</span>' : '<span class="badge badge-danger">Belum Bayar</span>'}
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <input type="checkbox" ${m.sudahBayar ? "checked" : ""} data-id="${m.id}" data-name="${m.nama}" class="pay-checkbox" style="width: 20px; height: 20px; cursor: pointer;">
        <button data-delete="${m.id}" style="background: var(--danger-red); width: auto; padding: 6px 10px; font-size: 0.8rem;"><i class="fas fa-trash"></i></button>
      </div>
    `;
    memberListContainer.appendChild(card);
  });

  // Event listener checkbox bayar
  document.querySelectorAll(".pay-checkbox").forEach(chk => {
    chk.addEventListener("change", async (e) => {
      const id = e.target.getAttribute("data-id");
      const name = e.target.getAttribute("data-name");
      const isChecked = e.target.checked;
      
      await togglePaymentStatus(id, name, isChecked);
    });
  });

  // Event listener hapus anggota
  document.querySelectorAll("[data-delete]").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.getAttribute("data-delete");
      if (confirm("Yakin ingin menghapus anggota ini?")) {
        await deleteDoc(doc(db, "anggota", id));
        loadMembers();
      }
    });
  });
}

function loadMembers() {
  onSnapshot(collection(db, "anggota"), (snapshot) => {
    allMembers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderMembers(searchMember.value);
  });
}
loadMembers();

searchMember.addEventListener("input", (e) => {
  renderMembers(e.target.value);
});

// Fungsi Toggle Status Bayar & Update Saldo Otomatis + Log
async function togglePaymentStatus(memberId, memberName, status) {
  try {
    const settingsSnap = await getDoc(doc(db, "pengaturan", "kelas"));
    const nominal = settingsSnap.exists() ? settingsSnap.data().nominalPayar || 2000 : 2000;

    // Update status anggota
    await updateDoc(doc(db, "anggota", memberId), {
      sudahBayar: status,
      updatedAt: serverTimestamp()
    });

    // Ambil saldo saat ini
    const saldoRef = doc(db, "kas", "saldo");
    const saldoSnap = await getDoc(saldoRef);
    let currentSaldo = saldoSnap.exists() ? saldoSnap.data().nominal || 0 : 0;

    const delta = status ? nominal : -nominal;
    const newSaldo = currentSaldo + delta;

    // Update saldo kas
    await setDoc(saldoRef, { nominal: newSaldo, updatedAt: serverTimestamp() }, { merge: true });

    // Tambah log perubahan saldo
    await addDoc(collection(db, "kas", "log"), {
      nama: memberName,
      nominal: delta,
      tipe: status ? "Pembayaran Masuk" : "Pembatalan Pembayaran",
      timestamp: serverTimestamp()
    });

  } catch (err) {
    console.error(err);
    alert("Gagal memperbarui status pembayaran.");
  }
}
