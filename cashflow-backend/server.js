const express  = require("express");
const cors     = require("cors");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const Database = require("better-sqlite3");
const path     = require("path");

const app        = express();
const PORT       = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "cashflow_secret_change_moi_en_prod";

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// ── Base de données ──────────────────────────────────────────
const db = new Database(path.join(__dirname, "cashflow.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT UNIQUE NOT NULL,
    email      TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id          TEXT PRIMARY KEY,
    user_id     INTEGER NOT NULL,
    type        TEXT NOT NULL CHECK(type IN ('income','expense')),
    label       TEXT NOT NULL,
    amount      REAL NOT NULL,
    date        TEXT NOT NULL,
    category_id TEXT NOT NULL,
    note        TEXT DEFAULT '',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS categories (
    id      TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name    TEXT NOT NULL,
    type    TEXT NOT NULL CHECK(type IN ('income','expense')),
    icon    TEXT NOT NULL DEFAULT '💰',
    color   TEXT NOT NULL DEFAULT '#00e5a0',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// ── Auth middleware ──────────────────────────────────────────
const auth = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer "))
    return res.status(401).json({ error: "Token manquant" });
  try {
    req.userId = jwt.verify(h.split(" ")[1], JWT_SECRET).userId;
    next();
  } catch {
    res.status(401).json({ error: "Token invalide ou expiré" });
  }
};

const DEFAULT_CATS = [
  { name:"Salaire",      type:"income",  icon:"💰", color:"#00e5a0" },
  { name:"Commerce",     type:"income",  icon:"🏪", color:"#4d9fff" },
  { name:"Autre revenu", type:"income",  icon:"🎁", color:"#a78bfa" },
  { name:"Logement",     type:"expense", icon:"🏠", color:"#ff4d6d" },
  { name:"Alimentation", type:"expense", icon:"🛒", color:"#ffd166" },
  { name:"Transport",    type:"expense", icon:"🚗", color:"#4d9fff" },
  { name:"Loisirs",      type:"expense", icon:"🎬", color:"#a78bfa" },
  { name:"Santé",        type:"expense", icon:"💊", color:"#ff6b35" },
  { name:"Téléphone",    type:"expense", icon:"📱", color:"#06d6a0" },
  { name:"Vêtements",    type:"expense", icon:"👗", color:"#e040fb" },
];

// ════ AUTH ════════════════════════════════════════════════════

// Register
app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: "Tous les champs sont requis" });
  if (password.length < 6)
    return res.status(400).json({ error: "Mot de passe trop court (min 6 caractères)" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: "Email invalide" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { lastInsertRowid: uid } = db.prepare(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)"
    ).run(username.trim(), email.toLowerCase().trim(), hash);

    const catStmt = db.prepare(
      "INSERT INTO categories (id, user_id, name, type, icon, color) VALUES (?, ?, ?, ?, ?, ?)"
    );
    DEFAULT_CATS.forEach((c, i) =>
      catStmt.run(`cat_${uid}_${i + 1}`, uid, c.name, c.type, c.icon, c.color)
    );

    const token = jwt.sign({ userId: uid }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: uid, username, email } });
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      if (err.message.includes("email"))    return res.status(409).json({ error: "Email déjà utilisé" });
      if (err.message.includes("username")) return res.status(409).json({ error: "Nom d'utilisateur déjà pris" });
    }
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email et mot de passe requis" });
  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim());
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Me
app.get("/api/auth/me", auth, (req, res) => {
  const user = db.prepare("SELECT id, username, email FROM users WHERE id = ?").get(req.userId);
  if (!user) return res.status(404).json({ error: "Introuvable" });
  res.json({ user });
});

// ════ TRANSACTIONS ════════════════════════════════════════════

app.get("/api/transactions", auth, (req, res) => {
  res.json(db.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC").all(req.userId));
});

app.post("/api/transactions", auth, (req, res) => {
  const { id, type, label, amount, date, category_id, note } = req.body;
  if (!id || !type || !label || !amount || !date || !category_id)
    return res.status(400).json({ error: "Champs manquants" });
  db.prepare("INSERT INTO transactions (id,user_id,type,label,amount,date,category_id,note) VALUES (?,?,?,?,?,?,?,?)")
    .run(id, req.userId, type, label, parseFloat(amount), date, category_id, note || "");
  res.status(201).json({ success: true });
});

app.delete("/api/transactions/:id", auth, (req, res) => {
  const r = db.prepare("DELETE FROM transactions WHERE id=? AND user_id=?").run(req.params.id, req.userId);
  if (r.changes === 0) return res.status(404).json({ error: "Introuvable" });
  res.json({ success: true });
});

// ════ CATEGORIES ═════════════════════════════════════════════

app.get("/api/categories", auth, (req, res) => {
  res.json(db.prepare("SELECT * FROM categories WHERE user_id = ?").all(req.userId));
});

app.post("/api/categories", auth, (req, res) => {
  const { id, name, type, icon, color } = req.body;
  if (!id || !name || !type) return res.status(400).json({ error: "Champs manquants" });
  db.prepare("INSERT INTO categories (id,user_id,name,type,icon,color) VALUES (?,?,?,?,?,?)")
    .run(id, req.userId, name, type, icon || "💰", color || "#00e5a0");
  res.status(201).json({ success: true });
});

app.put("/api/categories/:id", auth, (req, res) => {
  const { name, type, icon, color } = req.body;
  const r = db.prepare("UPDATE categories SET name=?,type=?,icon=?,color=? WHERE id=? AND user_id=?")
    .run(name, type, icon, color, req.params.id, req.userId);
  if (r.changes === 0) return res.status(404).json({ error: "Introuvable" });
  res.json({ success: true });
});

app.delete("/api/categories/:id", auth, (req, res) => {
  const r = db.prepare("DELETE FROM categories WHERE id=? AND user_id=?").run(req.params.id, req.userId);
  if (r.changes === 0) return res.status(404).json({ error: "Introuvable" });
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Cashflow API → http://localhost:${PORT}\n`);
});
