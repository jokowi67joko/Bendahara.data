const admin = require("firebase-admin");

// Inisialisasi Firebase Admin SDK (pastikan menggunakan environment variables Vercel atau inisialisasi aman)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Ganti newline untuk private key di environment variable Vercel
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
    })
  });
}

const db = admin.firestore();

module.exports = async (req, res) => {
  // Izinkan CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  const { key } = req.body;
  if (!key) {
    return res.status(400).json({ success: false, message: "Kode akses tidak boleh kosong." });
  }

  try {
    // 1. Cek Admin Key
    const adminKeySnap = await db.collection("admin_key").get();
    let isAdminMatch = false;
    adminKeySnap.forEach(doc => {
      if (doc.data().key === key) {
        isAdminMatch = true;
      }
    });

    if (isAdminMatch) {
      const uid = "admin_user";
      const customToken = await admin.auth().createCustomToken(uid, { role: "admin" });
      return res.status(200).json({
        success: true,
        role: "admin",
        token: customToken
      });
    }

    // 2. Cek Anggota Key
    const memberQuery = await db.collection("anggota").where("key", "==", key).get();
    if (!memberQuery.empty) {
      const memberDoc = memberQuery.docs[0];
      const memberData = memberDoc.data();
      const memberId = memberDoc.id;

      const uid = "member_" + memberId;
      const customToken = await admin.auth().createCustomToken(uid, { role: "anggota" });

      return res.status(200).json({
        success: true,
        role: "anggota",
        name: memberData.nama,
        memberId: memberId,
        token: customToken
      });
    }

    return res.status(200).json({
      success: false,
      message: "Kode akses salah."
    });

  } catch (error) {
    console.error("Error verifying key:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server." });
  }
};
