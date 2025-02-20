const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Firebase Initialization
let firebaseConfig;
try {
  firebaseConfig = JSON.parse(process.env.FIREBASE_CREDENTIALS);
} catch (error) {
  console.error("❌ Firebase credentials are not properly set.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
});

const db = admin.firestore();

// ✅ Root Route (Fix for "Cannot GET /")
app.get("/", (req, res) => {
    res.send("🚀 Referral Tracking System is Live!");
});

// ✅ User Registration & Login
app.post("/register", async (req, res) => {
  try {
    const { uid, email, referralCode } = req.body;
    if (!uid || !email) return res.status(400).json({ error: "Missing uid or email" });

    await db.collection("users").doc(uid).set({
      email,
      referralCode: referralCode || null,
      referredBy: referralCode ? referralCode : null,
      balance: 0,
    });

    res.status(200).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Referral Link Click Tracking
app.post("/track-click", async (req, res) => {
  try {
    const { referralCode } = req.body;
    if (!referralCode) return res.status(400).json({ error: "Missing referral code" });

    await db.collection("clicks").add({
      referralCode,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ message: "Click tracked successfully" });
  } catch (error) {
    console.error("Error tracking click:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Admin Dashboard API
app.get("/admin/stats", async (req, res) => {
  try {
    const usersSnap = await db.collection("users").get();
    const users = usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
