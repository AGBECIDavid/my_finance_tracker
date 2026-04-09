# 💰 Cashflow — Gestion de Finances Personnelles

Application web complète pour suivre ses revenus, dépenses et cashflow. Architecture propre, multi-utilisateur, prête à déployer.

## 🛠️ Stack

**Backend** : Node.js + Express + Prisma + SQLite + JWT
**Frontend** : React + Vite + Tailwind CSS + Recharts + Axios

## 📁 Structure

```
cashflow-app/
├── backend/      # API REST (port 5000)
└── frontend/     # Interface React (port 5173)
```

## 🚀 Installation (première fois)

### 1. Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init   # crée la base SQLite
npm run dev                          # démarre sur http://localhost:5000
```

La base de données SQLite sera créée automatiquement dans `backend/prisma/dev.db`.

### 2. Frontend (dans un autre terminal)

```bash
cd frontend
npm install
npm run dev                          # démarre sur http://localhost:5173
```

### 3. Utilisation

1. Ouvre http://localhost:5173
2. Clique sur "S'inscrire" pour créer un compte
3. Les catégories par défaut sont créées automatiquement (Salaire, Nourriture, Transport…)
4. Ajoute tes transactions et explore le dashboard

## 📡 API Endpoints

Toutes les routes sauf `/auth/register` et `/auth/login` nécessitent un header `Authorization: Bearer <token>`.

### Auth
- `POST /api/auth/register` — `{ name, email, password }`
- `POST /api/auth/login` — `{ email, password }`
- `GET /api/auth/me` — infos de l'utilisateur connecté

### Catégories
- `GET /api/categories`
- `POST /api/categories` — `{ name, type, color, icon }`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

### Transactions
- `GET /api/transactions?startDate=&endDate=&type=&search=`
- `POST /api/transactions` — `{ amount, type, description, date, categoryId }`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`

### Dashboard
- `GET /api/dashboard/summary` — `{ totalIncome, totalExpense, cashflow }`
- `GET /api/dashboard/expenses-by-category` — pour le pie chart
- `GET /api/dashboard/monthly?months=6` — pour le bar chart

## 🗄️ Base de données

3 tables gérées par Prisma :

- **User** : `id, email, password (hash bcrypt), name`
- **Category** : `id, name, type (INCOME/EXPENSE), color, icon, userId`
- **Transaction** : `id, amount, type, description, date, categoryId, userId`

Chaque requête filtre par `userId` pour garantir l'isolation multi-utilisateur.

### Commandes Prisma utiles
```bash
npx prisma studio           # interface visuelle de la DB (http://localhost:5555)
npx prisma migrate reset    # réinitialise la DB (⚠️ supprime tout)
npx prisma generate         # régénère le client après modif du schema
```

## 🌐 Déploiement en ligne

### Backend (Render / Railway — gratuit)

1. Pousse ton code sur GitHub
2. Sur **Render.com** : New Web Service → connecte ton repo → dossier `backend`
3. Variables d'environnement :
   - `DATABASE_URL=file:./prod.db`
   - `JWT_SECRET=<une-longue-chaine-aléatoire>`
   - `CLIENT_URL=<url-de-ton-frontend>`
   - `NODE_ENV=production`
4. Build command : `npm install && npx prisma migrate deploy`
5. Start command : `npm start`

> 💡 Pour de la vraie production, passe à PostgreSQL : change `provider = "postgresql"` dans `schema.prisma` et utilise l'URL Postgres fournie par Render.

### Frontend (Vercel / Netlify — gratuit)

1. Sur **Vercel.com** : Import project → dossier `frontend`
2. Variable d'environnement : `VITE_API_URL=<url-de-ton-backend>/api`
3. Deploy — c'est tout

## 🏗️ Architecture backend

```
routes        →  définit les URLs et les middlewares
controllers   →  reçoit la requête, valide, appelle le service, renvoie JSON
services      →  logique métier + accès base (via Prisma)
middleware    →  auth JWT, gestion d'erreurs
```

Chaque couche a **une seule responsabilité**. Pour ajouter une fonctionnalité :
1. Ajoute une fonction dans le service
2. Ajoute un handler dans le controller
3. Ajoute une route

## 🎨 Fonctionnalités

- ✅ Authentification (register/login) avec JWT
- ✅ Multi-utilisateur (chaque user voit ses propres données)
- ✅ CRUD complet des transactions
- ✅ CRUD complet des catégories (avec icônes et couleurs)
- ✅ Dashboard avec KPIs (revenus, dépenses, cashflow)
- ✅ Graphiques : pie chart des dépenses + bar chart mensuel
- ✅ Filtres (type, date, recherche texte)
- ✅ Design responsive (mobile + desktop)
- ✅ Catégories par défaut créées à l'inscription

## 🔐 Sécurité

- Mots de passe hashés avec bcrypt (10 rounds)
- JWT signés avec secret en variable d'environnement
- Toutes les requêtes DB filtrent par `userId`
- CORS configuré pour accepter uniquement le frontend

## 🐛 Troubleshooting

**"Cannot find module '@prisma/client'"** → lance `npx prisma generate` dans `backend/`

**"Token invalid" après modification du .env** → déconnecte-toi et reconnecte-toi (le JWT_SECRET a changé)

**Erreur CORS** → vérifie que `CLIENT_URL` dans `backend/.env` correspond bien à l'URL du frontend

**Port déjà utilisé** → change `PORT=5000` dans `backend/.env` et `VITE_API_URL` dans `frontend/.env`

## 📚 Pour aller plus loin

- Ajouter des budgets mensuels par catégorie
- Export CSV/PDF des transactions
- Transactions récurrentes
- Mode sombre
- Application mobile (React Native)
- Migration vers PostgreSQL

---

Made with ❤️ — Architecture propre pour apprendre le fullstack.
