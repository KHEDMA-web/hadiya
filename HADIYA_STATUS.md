# HADIYA — STATUS COMPLET DU PROJET
> Dernière mise à jour : 2026-05-16 — v4 (isolation multi-salon complète)

---

## 1. STACK TECHNIQUE

| Technologie | Version | Rôle |
|---|---|---|
| **Next.js** | 16.2.4 | Framework fullstack (App Router) |
| **React** | 19.2.4 | UI |
| **TypeScript** | ^5 | Typage strict |
| **Tailwind CSS** | ^4 | Styles (via PostCSS) |
| **@tailwindcss/postcss** | ^4 | Plugin PostCSS pour Tailwind 4 |
| **Supabase JS** | ^2.105.3 | Client DB + auth |
| **@supabase/ssr** | ^0.10.3 | Supabase côté serveur (cookies) |
| **qrcode** | ^1.5.4 | Génération QR code |
| **@types/qrcode** | ^1.5.6 | Types QR |
| **html5-qrcode** | ^2.3.8 | Scanner QR via caméra |
| **recharts** | ^3.8.1 | Graphiques / statistiques |
| **ESLint** | ^9 | Linting |
| **eslint-config-next** | 16.2.4 | Rules Next.js |
| Node types | ^20 | Types Node.js |

**Bundler :** Webpack (Turbopack désactivé — `next dev --webpack`)
**Hébergement :** Vercel
**Base de données :** Supabase (PostgreSQL)
**Automatisations :** n8n (WhatsApp / email / PDF)
**Paiement :** Chargily Pay (API v2, mode test)

---

## 2. STRUCTURE DES FICHIERS

```
hadiya/
├── src/
│   ├── app/
│   │   ├── layout.tsx                        ← Root layout + enregistrement SW
│   │   ├── page.tsx                          ← Redirects → /login
│   │   ├── globals.css                       ← Tailwind + classes design system
│   │   ├── favicon.ico
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx                      ← Authentification salon
│   │   ├── register/
│   │   │   └── page.tsx                      ← Inscription salon (48 wilayas)
│   │   │
│   │   ├── carte/
│   │   │   ├── page.tsx                      ← Redirect via cookie hadiya_uid
│   │   │   └── [uid]/page.tsx                ← Carte client mobile (publique)
│   │   │
│   │   ├── gift-card/
│   │   │   ├── page.tsx                      ← Tunnel achat carte cadeau (4 étapes)
│   │   │   ├── [slug]/page.tsx               ← Page paiement branded par salon ✅ NOUVEAU
│   │   │   ├── success/page.tsx              ← Confirmation paiement réussi
│   │   │   └── echec/page.tsx                ← Page échec paiement
│   │   │
│   │   ├── scan/
│   │   │   └── page.tsx                      ← Scanner QR (page autonome)
│   │   │
│   │   ├── dashboard/
│   │   │   ├── page.tsx                      ← Accueil dashboard (stats + RFID realtime)
│   │   │   ├── _components/
│   │   │   │   ├── BackButton.tsx            ← Bouton retour réutilisable
│   │   │   │   └── ClientModal.tsx           ← Modal 4 onglets (vente/recharge/historique/infos)
│   │   │   ├── scanner/page.tsx              ← Scanner QR + saisie manuelle UID
│   │   │   ├── caisse/page.tsx               ← Caisse POS + paiement NFC/RFID
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx                  ← Liste clients avec recherche
│   │   │   │   └── [id]/page.tsx             ← Fiche client détaillée
│   │   │   ├── recharge/page.tsx             ← Recharge solde carte
│   │   │   ├── produits/page.tsx             ← Catalogue produits/services
│   │   │   ├── statistiques/page.tsx         ← KPIs + graphiques Recharts
│   │   │   ├── transactions/page.tsx         ← Historique transactions
│   │   │   ├── notifications/page.tsx        ← Centre notifications
│   │   │   ├── cartes/
│   │   │   │   └── nouvelle/page.tsx         ← Créer nouvelle carte
│   │   │   └── admin/
│   │   │       ├── page.tsx                  ← Hub admin
│   │   │       ├── employes/page.tsx         ← Gestion employés + permissions
│   │   │       └── parametres/page.tsx       ← Paramètres salon + fidélité
│   │   │
│   │   └── api/
│   │       ├── checkout/route.ts             ← POST: créer session Chargily
│   │       └── webhook/chargily/route.ts     ← POST: webhook paiement confirmé
│   │
│   ├── lib/
│   │   ├── supabase.ts                       ← Client Supabase (singleton)
│   │   ├── auth.ts                           ← Types + helpers auth/permissions
│   │   └── fidelite.ts                       ← Logique fidélité (points, niveaux)
│   │
│   └── middleware.ts                         ← Vérification permissions routes /dashboard
│
├── public/
│   ├── manifest.json                         ← PWA manifest
│   ├── sw.js                                 ← Service worker (network-first + cache)
│   └── icons/
│       ├── icon-180.png                      ← Apple touch icon
│       ├── icon-192.png                      ← PWA icon
│       └── icon-512.png                      ← PWA splash
│
├── .env.local                                ← Variables d'environnement (non versionné)
├── next.config.ts                            ← Config Next.js (minimale)
├── tsconfig.json
├── package.json
├── CLAUDE.md
├── AGENTS.md
└── HADIYA_STATUS.md                          ← Ce fichier
```

**Total :** 34 fichiers source · 2 routes API · 3 modules lib · 1 middleware

---

## 3. FONCTIONNALITÉS COMPLÈTES ✅

### Authentification & Accès
- [x] Login email/password via Supabase Auth
- [x] Inscription salon (nom, email, mot de passe, téléphone, wilaya)
- [x] Middleware de protection des routes `/dashboard/*`
- [x] Système de permissions par route (9 permissions granulaires)
- [x] Rôles prédéfinis : `proprio`, `caissier`, `receptionniste`, `manager`
- [x] Gestion employés avec activation/désactivation

### Carte Cadeau (flux en ligne)
- [x] Tunnel d'achat 4 étapes : bénéficiaire → message → montant → paiement
- [x] Intégration Chargily Pay (redirection checkout)
- [x] Webhook de confirmation paiement → création automatique carte + client
- [x] **Page paiement unique par salon** `/gift-card/[slug]` — nom du salon affiché, `salon_id` attaché
- [x] **Sécurité webhook HMAC sha256** — signature Chargily vérifiée, requêtes forgées rejetées (401)
- [x] Page succès / page échec
- [x] Notification realtime dashboard à chaque nouvelle carte vendue

### Carte Client (mobile, publique)
- [x] Page `/carte/[uid]` (accès public sans login)
- [x] Affichage solde, points, niveau fidélité
- [x] Barre de progression vers prochain niveau
- [x] Historique des dernières transactions
- [x] Avantages par niveau (Bronze/Argent/Or/Platine)
- [x] QR code intégré (api.qrserver.com)
- [x] Mise à jour en temps réel via Supabase Realtime
- [x] Installable comme PWA (scope `/carte`)
- [x] Cookie `hadiya_uid` → redirect automatique depuis `/carte`

### Dashboard Salon
- [x] Accueil avec stats : cartes actives, clients, transactions du jour
- [x] Scanner RFID/NFC en temps réel (Supabase Realtime sur table `scans`)
- [x] Toast + modal automatique à chaque scan
- [x] Cloche de notifications avec compteur non-lu
- [x] Navigation avec vérification permissions

### Caisse POS
- [x] Catalogue articles avec emoji, prix, catégorie, durée
- [x] Sélection articles + quantités
- [x] Calcul total automatique
- [x] Paiement NFC via Web NFC API (Android Chrome)
- [x] Fallback saisie manuelle UID
- [x] Débit solde carte après scan

### Clients
- [x] Liste clients avec recherche (nom, téléphone)
- [x] Fiche client détaillée (infos, allergies, préférences massage, notes praticien)
- [x] Historique transactions par client
- [x] ClientModal 4 onglets : vente / recharge / historique / infos

### Fidélité
- [x] Calcul points (configurable : X pts par 100 DA)
- [x] 4 niveaux : Bronze / Argent / Or / Platine
- [x] Seuils configurables par salon
- [x] Progression par niveau en pourcentage
- [x] Activation/désactivation du programme fidélité par salon

### Recharge
- [x] Recharge solde carte par UID
- [x] Montants rapides prédéfinis
- [x] Enregistrement transaction

### Produits / Catalogue
- [x] Ajout/modification/suppression articles (nom, prix, emoji, catégorie, durée)
- [x] Activation/désactivation article
- [x] Catégories visuelles

### Statistiques
- [x] KPIs : CA total, nombre transactions, solde moyen, clients actifs
- [x] Graphiques Recharts (courbes, barres)
- [x] Filtres par période

### Historique
- [x] Toutes les transactions avec type, montant, date
- [x] Filtres et recherche

### Administration
- [x] Gestion employés (création, modification, permissions individuelles)
- [x] Paramètres salon (nom, téléphone, wilaya)
- [x] Configuration programme fidélité (seuils, taux de points)

---

## 4. INTÉGRATIONS

### Supabase

**Auth :** Supabase Auth (email/password)

**Tables utilisées :**

| Table | Utilisée dans |
|---|---|
| `salons` | Auth, permissions, fidélité, paramètres |
| `employes` | Permissions middleware, gestion admin |
| `clients` | Carte client, caisse, recherche, webhook |
| `cartes` | Carte client, scanner, caisse, webhook |
| `transactions` | Historique, stats, webhook, carte client |
| `menu_items` | Caisse POS, catalogue produits |
| `notifications` | Dashboard bell, webhook Chargily |
| `scans` | Realtime RFID dashboard |
| `commandes` | (Référencé CLAUDE.md — à confirmer) |
| `commande_items` | (Référencé CLAUDE.md — à confirmer) |

**Realtime actif sur :**
- `scans` → INSERT → dashboard RFID auto-popup
- `notifications` → INSERT → cloche dashboard
- `cartes` → UPDATE → carte client mobile live
- `transactions` → INSERT → historique live sur carte client

**Colonnes fidélité sur `salons` :**
- `fidelite_actif` (boolean)
- `points_par_100da` (integer, défaut 2)
- `seuil_argent` (integer, défaut 500)
- `seuil_or` (integer, défaut 1500)
- `seuil_platine` (integer, défaut 3000)

**RLS :** Activé côté Supabase (le code utilise la clé anon sauf webhook qui utilise `service_role`)

---

### Chargily Pay

**Mode :** Test (`pay.chargily.net/test/api/v2/`) — en attente des clés production
**Flux :**
```
/gift-card/[slug] → POST /api/checkout → Chargily (DZD) → redirect
                         ↓ (paiement confirmé)
Chargily → POST /api/webhook/chargily → vérif HMAC ✅ → Supabase (client + carte + transaction + notification) → n8n
```

**Metadata transmise dans le checkout :**
- `salonId` — UUID du salon pour isolation multi-tenant
- `beneficiaryFirstName`, `beneficiaryLastName`
- `beneficiaryPhone`, `beneficiaryEmail`, `beneficiaryBirthDate`
- `offeredBy`, `message`

**Sécurité webhook :**
- Header `signature` vérifié via HMAC sha256 avec `CHARGILY_SECRET_KEY`
- Comparaison `timingSafeEqual` — résistant aux timing attacks
- Requête sans signature ou signature invalide → 401 immédiat

**Passer en production :**
1. Remplacer `CHARGILY_SECRET_KEY` dans Vercel par la clé prod
2. Changer l'URL dans `/api/checkout/route.ts` : `pay.chargily.net/test/` → `pay.chargily.net/`

---

### NFC Android (Web NFC API)

**API utilisée :** `NDEFReader` (Chrome Android 89+)
**Vérification :** `'NDEFReader' in window`
**Implémenté dans :** `/dashboard/caisse`
**Fallback :** Saisie manuelle UID toujours disponible
**Limitation :** Ne fonctionne que sur Android avec Chrome. iOS non supporté.

---

### PWA (Progressive Web App)

**Manifest :** `/public/manifest.json`
```json
{
  "name": "Hadiya — Carte client",
  "short_name": "Hadiya",
  "start_url": "/carte",
  "scope": "/carte",
  "display": "standalone",
  "theme_color": "#2C2A25",
  "background_color": "#F7F4EE"
}
```

**Service Worker :** `/public/sw.js`
- Stratégie : **Network-first** + fallback cache
- Cache shell : `/`, `/manifest.json`, icônes
- Enregistrement : `src/app/layout.tsx` (côté client)
- Cache name : `hadiya-v1`

---

### n8n (WhatsApp / Email / PDF)

**Déclenché par :** webhook Chargily après paiement confirmé
**Variable requise :** `N8N_WEBHOOK_URL` (optionnel — graceful fallback)
**Payload envoyé :**
```json
{
  "phone": "...",
  "email": "...",
  "prenom": "...",
  "nom": "...",
  "montant": 5000,
  "message": "...",
  "offertPar": "...",
  "carteId": "uuid"
}
```

---

## 5. VARIABLES D'ENVIRONNEMENT REQUISES

| Variable | Requis | Description | Où trouver |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Oui** | URL du projet Supabase | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Oui** | Clé anonyme Supabase (publique) | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | **Oui** (webhook) | Clé service Supabase (bypass RLS) | Supabase Dashboard → Settings → API |
| `CHARGILY_SECRET_KEY` | **Oui** | Clé secrète Chargily (test: `test_sk_...`) | Chargily Dashboard → Développeurs |
| `NEXT_PUBLIC_URL` | **Oui** | URL de base de l'app | `http://localhost:3000` en dev, URL Vercel en prod |
| `N8N_WEBHOOK_URL` | Non | URL webhook n8n pour WhatsApp/email | Instance n8n → Webhook node |

**Fichier `.env.local` (dev) :**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CHARGILY_SECRET_KEY=test_sk_...
NEXT_PUBLIC_URL=http://localhost:3000
N8N_WEBHOOK_URL=https://n8n.domain.com/webhook/xxx   # optionnel
```

---

## 6. SCHEMA BASE DE DONNÉES

### `salons`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `email` | text | Email du propriétaire |
| `nom` | text | Nom du salon |
| `telephone` | text | |
| `wilaya` | text | Wilaya algérienne |
| `owner_id` | uuid | FK → auth.users |
| `slug` | text | Unique — URL de paiement `/gift-card/[slug]` ✅ |
| `avantages_fidelite` | jsonb | `{"bronze":"","argent":"","or":"","platine":""}` — avantages affichés sur la carte client ✅ |
| `fidelite_actif` | boolean | Défaut: true |
| `points_par_100da` | integer | Défaut: 2 |
| `seuil_argent` | integer | Défaut: 500 pts |
| `seuil_or` | integer | Défaut: 1500 pts |
| `seuil_platine` | integer | Défaut: 3000 pts |

### `employes`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → auth.users |
| `nom` | text | |
| `prenom` | text | |
| `role` | text | caissier / receptionniste / manager |
| `permissions` | jsonb | `{ caisse: bool, scanner: bool, ... }` |
| `actif` | boolean | |

### `clients`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `prenom` | text | |
| `nom` | text | |
| `telephone` | text | Index (unique lookup) |
| `email` | text | Nullable |
| `date_naissance` | date | Nullable |
| `niveau` | text | Bronze/Argent/Or/Platine |
| `points` | integer | Total points fidélité |
| `allergies` | text | Nullable |
| `preferences_massage` | text | Nullable |
| `notes_praticien` | text | Nullable |

### `cartes`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `client_id` | uuid | FK → clients |
| `uid_rfid` | text | UUID ou UID puce NFC/RFID |
| `type` | text | `cadeau` / `fidelite` |
| `solde` | numeric | Solde en DA |
| `points` | integer | Points fidélité |
| `niveau` | text | Niveau fidélité |
| `statut` | text | actif / expiré / bloqué |
| `message_perso` | text | Nullable |
| `offert_par` | text | Nullable |
| `date_expiration` | timestamptz | +1 an à la création |
| `source` | text | `online` / `comptoir` |
| `first_opened_at` | timestamptz | Premier scan client |
| `created_at` | timestamptz | |

### `transactions`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `carte_id` | uuid | FK → cartes |
| `type` | text | `cadeau` / `debit` / `recharge` |
| `montant` | numeric | Montant en DA |
| `points_gagnes` | integer | Nullable |
| `description` | text | |
| `created_at` | timestamptz | |

### `menu_items`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `nom` | text | |
| `prix` | numeric | En DA |
| `emoji` | text | |
| `categorie` | text | |
| `duree_minutes` | integer | Nullable |
| `actif` | boolean | |

### `notifications`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `type` | text | `nouvelle_carte_cadeau` / ... |
| `titre` | text | |
| `message` | text | |
| `lu` | boolean | Défaut: false |
| `meta` | jsonb | Données contextuelles |
| `created_at` | timestamptz | |

### `scans`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `uid_carte` | text | UID de la carte scannée |
| `created_at` | timestamptz | |

---

## 7. CHECKLIST SESSION EN COURS 🎯

> **Workflow :** Au début de chaque session, Claude lit cette section et demande ce qui est fait. Tu coches, il met à jour et on continue.

### Sprint actuel — À faire
- [x] **Impression reçu caisse** — ticket thermique (80mm) après paiement, bouton 🖨 + `window.print()` + CSS `@media print`
- [x] **SQL backlog complet** — `transactions/notifications/employes.salon_id`, `salons.logo_url`, index sur salon_id
- [x] **Plans d'abonnement** — liste de fonctionnalités par plan + badge "Actuel"
- [x] **Avantages fidélité par niveau** — config Bronze/Argent/Or/Platine dans Paramètres + carte client dynamique
- [x] **Page scanner** — historique des 6 derniers débits (auto-refresh)
- [x] **Page statistiques** — export CSV de la période sélectionnée (bouton ↓ CSV)
- [x] **Page produits** — import en masse : coller Nom, Prix, Emoji, Catégorie → prévisualisation → import
- [ ] **Passer Chargily en production** — changer `CHARGILY_SECRET_KEY` dans Vercel + URL dans `/api/checkout/route.ts` (en attente des clés Chargily)
- [x] **SQL Supabase** — exécuter : `ALTER TABLE clients ADD COLUMN IF NOT EXISTS salon_id uuid REFERENCES salons(id);` et `ALTER TABLE salons ADD COLUMN IF NOT EXISTS slug text UNIQUE;` + `avantages_fidelite jsonb`

### ✅ Fait récemment
- [x] **Plans d'abonnement** — liste de fonctionnalités par plan (parametres Abonnement)
- [x] **Avantages fidélité par niveau** — config par salon dans onglet Fidélité + carte client dynamique
- [x] **Scanner** — historique des 6 derniers débits auto-rafraîchi
- [x] **Statistiques** — export CSV période sélectionnée (BOM UTF-8 pour Excel)
- [x] **Produits** — import en masse (coller liste → prévisualiser → importer)
- [x] **SQL Supabase** — `clients.salon_id`, `salons.slug`, `salons.avantages_fidelite`
- [x] Page paiement unique par salon `/gift-card/[slug]`
- [x] Sécurité webhook HMAC sha256 (Chargily)
- [x] `salon_id` transmis dans checkout + webhook

---

## 8. CE QUI RESTE À FAIRE (backlog) ⏳

### Bugs connus
- [x] **Auth middleware passif** : ✅ Corrigé — `createServerClient` de `@supabase/ssr`, redirect server-side, 0 flash blanc
- [x] **Lookup employé via email** : ✅ Corrigé — `getUserProfile()` utilise maintenant `employes.salon_id` pour trouver le salon
- [ ] **`SUPABASE_SERVICE_ROLE_KEY` absent du `.env.local`** : Le webhook Chargily crashe en local si cette variable n'est pas définie.
- [ ] **Turbopack désactivé** : `npm run dev --webpack` — cause à identifier (conflit possible avec Tailwind 4 ou CSS modules).

### Fonctionnalités manquantes
- [ ] **Passage en production Chargily** : Changer `CHARGILY_SECRET_KEY` dans Vercel + URL `pay.chargily.net/test/api/v2/` → `pay.chargily.net/api/v2/` dans `/api/checkout/route.ts` — en attente des vraies clés
- [ ] **Envoi WhatsApp / Email** : Dépend de n8n (`N8N_WEBHOOK_URL`) — voir section n8n ci-dessous
- [x] **Isolation multi-salon** : ✅ Toutes les pages dashboard filtrent par `salon_id` — clients, transactions, notifications, cartes, commandes, produits, statistiques, scanner, nouvelle carte. SQL à exécuter (voir Colonnes Supabase ci-dessous).
- [ ] **Logo salon** : Colonne `logo_url` existe mais pas d'UI d'upload (Supabase Storage)
- [ ] **Mode offline complet** : Le SW met en cache le shell mais les données Supabase ne sont pas cachées offline.

### n8n — Configuration requise
**Ce qu'il faut :**
1. **Héberger n8n** (2 options) :
   - n8n Cloud : ~20$/mois (simple, géré) → n8n.io
   - Auto-hébergé sur VPS : ~5-10$/mois (Hetzner/DigitalOcean) + n8n gratuit (open source)
2. **API WhatsApp** (au choix) :
   - **UltraMsg** : ~15$/mois — le plus simple, marche bien pour l'Algérie
   - **Wassenger** : ~25$/mois — plus stable
   - **360dialog** : ~50€/mois — officiel Meta, meilleure délivrabilité
3. **Compte WhatsApp Business** avec numéro dédié

**Coût total estimé :** 20-60$/mois selon les choix

**Ce qui est déjà prêt dans le code :**
Le webhook Chargily envoie déjà ce payload à n8n :
```json
{ "phone", "email", "prenom", "nom", "montant", "message", "offertPar", "carteId" }
```
Il suffit d'ajouter `N8N_WEBHOOK_URL` dans Vercel env et de créer le workflow n8n.

**Workflow n8n à créer :**
- Trigger : Webhook (reçoit le payload de Hadiya)
- Action 1 : WhatsApp → bénéficiaire ("Tu as reçu une carte cadeau de X DA de la part de Y")
- Action 2 (optionnel) : Email → acheteur (confirmation avec détails)

### ✅ Résolu récemment
- [x] **Lookup employé** : `getUserProfile()` utilise `employes.salon_id` — plus de lookup email fragile
- [x] **Page commandes** : `/dashboard/commandes` — liste des commandes POS avec détail articles, CA, recherche
- [x] **CRON expiration cartes** : Vercel cron `0 2 * * *` → `/api/cron/expire-cartes` (+ `CRON_SECRET` requis dans Vercel env)
- [x] **Scanner QR dans dashboard** : Bouton 📷 QR Code dans `/dashboard/scanner` — caméra intégrée, auto-fill UID
- [x] **Page `/scan` liée** : Bouton "📷 Scanner mobile" dans le dashboard → ouvre `/scan` (standalone, sans login)
- [x] **Auth middleware passif** : Middleware SSR avec `createServerClient` — redirect server-side, 0 flash blanc
- [x] **Impression reçu caisse** : Ticket `@media print` + `window.print()` — bouton 🖨 sur écran de confirmation
- [x] **Déconnexion** : Bouton logout dans le header du dashboard
- [x] **Recherche transactions** : Filtres par type + recherche par client/description
- [x] **Vérification signature webhook Chargily** : HMAC sha256 via `timingSafeEqual`
- [x] **Page paiement par salon** : `/gift-card/[slug]` — URL unique par salon

### Colonnes Supabase

**Déjà ajoutées ✅**
- [x] `clients.salon_id`
- [x] `salons.slug` (unique)
- [x] `salons.avantages_fidelite` (jsonb)
- [x] `salons.logo_url`
- [x] `transactions.salon_id` + index
- [x] `notifications.salon_id` + index
- [x] `employes.salon_id`

**À exécuter dans Supabase SQL Editor ⚠️**
```sql
-- Isolation multi-salon (isolation code déjà fait)
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS salon_id uuid REFERENCES salons(id);
UPDATE cartes SET salon_id = clients.salon_id
FROM clients WHERE cartes.client_id = clients.id AND clients.salon_id IS NOT NULL;

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS salon_id uuid REFERENCES salons(id);
UPDATE menu_items SET salon_id = (SELECT id FROM salons LIMIT 1) WHERE salon_id IS NULL;

ALTER TABLE scans ADD COLUMN IF NOT EXISTS salon_id uuid REFERENCES salons(id);
```

---

## 9. COMMANDES UTILES

```bash
# Lancer le serveur de développement
npm run dev

# Build de production (vérifier les erreurs TypeScript)
npm run build

# Démarrer le serveur de production local
npm start

# Lint
npm run lint

# Git — commit et push
git add .
git commit -m "feat: description"
git push origin master

# Installer les dépendances
npm install

# Vérifier les versions installées
npm list --depth=0
```

---

## 10. URLs IMPORTANTES

| Service | URL |
|---|---|
| **App locale** | `http://localhost:3000` |
| **Vercel (prod)** | Voir Vercel Dashboard |
| **Supabase Dashboard** | `https://supabase.com/dashboard` |
| **Supabase SQL Editor** | Supabase Dashboard → SQL Editor |
| **Supabase Auth** | Supabase Dashboard → Authentication |
| **Chargily Dashboard (test)** | `https://pay.chargily.net/test/dashboard` |
| **Chargily Webhooks** | Chargily Dashboard → Développeurs → Webhooks |
| **Chargily API (test)** | `https://pay.chargily.net/test/api/v2/` |
| **Chargily API (prod)** | `https://pay.chargily.net/api/v2/` |
| **n8n** | Instance auto-hébergée (URL configurée dans `N8N_WEBHOOK_URL`) |

---

## 11. DESIGN SYSTEM

### Couleurs
| Token | Hex | Usage |
|---|---|---|
| Fond crème | `#F7F4EE` | Fond principal |
| Fond sombre | `#2C2A25` | Dashboard dark |
| Fond profond | `#1E1C18` | Inputs, cartes |
| Or accent | `#BA7517` | Boutons CTA, hover, bordures |
| Pierre | `#8A8275` | Textes secondaires |

### Polices
- Serif titres : **Cormorant Garamond** (`--font-cormorant`)
- Sans-serif corps : **Geist Sans** (`--font-geist-sans`)

### Classes utilitaires (globals.css)
| Classe | Usage |
|---|---|
| `.hd-input` | Input dark avec hover or |
| `.hd-card` | Carte gradient sombre + bordure or |
| `.hd-btn` | Bouton principal sombre |
| `.hd-btn-gold` | Bouton or (CTA principal) |
| `.hd-back` | Bouton retour circulaire |
| `.hd-amount` | Pill montant recharge |
| `.hd-menu-item` | Article caisse POS |
| `.hd-row` | Ligne liste client/transaction |
| `.hd-fade` | Animation fade-up à l'entrée |
| `.hd-stat` | Stat avec animation + glow |

---

*Document généré automatiquement à partir du code source du projet.*
