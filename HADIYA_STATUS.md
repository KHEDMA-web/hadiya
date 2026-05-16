# HADIYA — STATUS COMPLET DU PROJET
> Dernière mise à jour : 2026-05-16 — v6 (réservations + produits refonte + schéma vérifié)

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
│   │   │   ├── [slug]/page.tsx               ← Page paiement branded par salon ✅
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
│   │   │   ├── produits/page.tsx             ← Soins (sous-cats + durée) + consommables (stock) ✅ refondu
│   │   │   ├── reservations/page.tsx         ← Agenda Jour/Semaine/Mois ✅ nouveau
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
│   │       ├── webhook/chargily/route.ts     ← POST: webhook paiement confirmé
│   │       └── employes/create/route.ts      ← POST: création employé (service role) ✅ nouveau
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
├── CLAUDE.md · AGENTS.md · SUPABASE.md · HADIYA_STATUS.md
```

---

## 3. FONCTIONNALITÉS COMPLÈTES ✅

### Authentification & Accès
- [x] Login email/password via Supabase Auth
- [x] Inscription salon (nom, email, mot de passe, téléphone, wilaya)
- [x] Middleware de protection des routes `/dashboard/*`
- [x] Système de permissions par route (9 permissions granulaires)
- [x] Rôles prédéfinis : `proprio`, `caissier`, `receptionniste`, `manager`
- [x] Gestion employés avec activation/désactivation
- [x] Création employé via API route (service role — session propriétaire préservée)

### Carte Cadeau (flux en ligne)
- [x] Tunnel d'achat 4 étapes : bénéficiaire → message → montant → paiement
- [x] Intégration Chargily Pay (redirection checkout)
- [x] Webhook de confirmation paiement → création automatique carte + client
- [x] Page paiement unique par salon `/gift-card/[slug]` — logo salon affiché
- [x] Sécurité webhook HMAC sha256 — signature Chargily vérifiée
- [x] Page succès / page échec
- [x] Notification realtime dashboard à chaque nouvelle carte vendue
- [x] Footer "Propulsé par HADIYA" sur pages publiques

### Carte Client (mobile, publique)
- [x] Page `/carte/[uid]` (accès public sans login)
- [x] Affichage solde, points, niveau fidélité
- [x] Barre de progression vers prochain niveau
- [x] Historique des dernières transactions
- [x] Avantages par niveau (Bronze/Argent/Or/Platine)
- [x] QR code intégré
- [x] Mise à jour en temps réel via Supabase Realtime
- [x] Installable comme PWA (scope `/carte`)
- [x] Logo salon affiché sur la carte

### Dashboard Salon
- [x] Accueil avec stats : cartes actives, clients, transactions du jour
- [x] Scanner RFID/NFC en temps réel (Supabase Realtime sur table `scans`)
- [x] Toast + modal automatique à chaque scan
- [x] Cloche de notifications avec compteur non-lu
- [x] Navigation avec vérification permissions
- [x] Logo salon dans le header

### Caisse POS
- [x] Catalogue articles avec emoji, prix, catégorie, durée
- [x] Sélection articles + quantités
- [x] Calcul total automatique
- [x] Paiement NFC via Web NFC API (Android Chrome)
- [x] Fallback saisie manuelle UID
- [x] Débit solde carte après scan
- [x] Impression reçu thermique 80mm (`@media print`)

### Clients
- [x] Liste clients avec recherche (nom, téléphone)
- [x] Fiche client détaillée (infos, allergies, préférences massage, notes praticien)
- [x] Historique transactions par client
- [x] ClientModal 4 onglets : vente / recharge / historique / infos

### Réservations ✅ nouveau
- [x] Vue Jour — mini calendrier semaine + liste du jour
- [x] Vue Semaine — 7 jours groupés avec compteurs
- [x] Vue Mois — grille calendrier avec dots + liste jour sélectionné
- [x] Créer réservation : client existant (recherche) ou nouveau client (→ créé en DB)
- [x] Sélection service (soins uniquement, consommables exclus)
- [x] Sélection employé, date, heure, notes
- [x] Actions : Confirmer / Terminé / Annuler / Supprimer / WhatsApp
- [x] Modal centré sur PC, bottom sheet sur mobile

### Fidélité
- [x] Calcul points (configurable : X pts par 100 DA)
- [x] 4 niveaux : Bronze / Argent / Or / Platine
- [x] Seuils configurables par salon
- [x] Progression par niveau en pourcentage
- [x] Activation/désactivation du programme fidélité par salon

### Produits / Catalogue ✅ refondu
- [x] Séparation soins (sous-catégories + durée) vs consommables (stock/seuil/unité)
- [x] Sous-catégories soins : massage, soin_visage, corps, manucure, coiffure, autre
- [x] Badge durée sur les soins
- [x] Gestion stock consommables (stock_actuel, stock_minimum, stock_unite)
- [x] Alertes stock faible / rupture
- [x] Recherche, compteurs par onglet
- [x] 4 actions par item : Modifier / Dupliquer / Activer/Désactiver / Supprimer
- [x] Import en masse (coller liste → prévisualiser → importer)

### Statistiques
- [x] KPIs : CA total, nombre transactions, solde moyen, clients actifs
- [x] Graphiques Recharts (courbes, barres)
- [x] Filtres par période
- [x] Export CSV (BOM UTF-8 pour Excel)

### Administration
- [x] Gestion employés (création, modification, permissions individuelles)
- [x] Paramètres salon (nom, téléphone, wilaya, logo)
- [x] Configuration programme fidélité (seuils, taux de points)
- [x] Changement mot de passe + sessions actives + déconnexion globale

---

## 4. INTÉGRATIONS

### Supabase

**Tables utilisées :**

| Table | Utilisée dans |
|---|---|
| `salons` | Auth, permissions, fidélité, paramètres, logo |
| `employes` | Permissions middleware, gestion admin |
| `clients` | Carte client, caisse, recherche, webhook, réservations |
| `cartes` | Carte client, scanner, caisse, webhook |
| `transactions` | Historique, stats, webhook, carte client |
| `menu_items` | Caisse POS, catalogue produits, réservations (soins) |
| `notifications` | Dashboard bell, webhook Chargily |
| `scans` | Realtime RFID dashboard |
| `reservations` | Agenda salon ✅ nouveau |
| `commandes` / `commande_items` | Tables existantes — pages non créées |

**Realtime actif sur :**
- `scans` → INSERT → dashboard RFID auto-popup
- `notifications` → INSERT → cloche dashboard
- `cartes` → UPDATE → carte client mobile live
- `transactions` → INSERT → historique live sur carte client

**Storage :**
- Bucket `logos` (public) — path `{salonId}.{ext}` — URL dans `salons.logo_url`

**RLS :** Activé. Code utilise clé anon sauf webhook + `/api/employes/create` (service_role).

---

### Chargily Pay

**Mode :** Test (`pay.chargily.net/test/api/v2/`) — en attente des clés production

**Flux :**
```
/gift-card/[slug] → POST /api/checkout → Chargily (DZD) → redirect
Chargily → POST /api/webhook/chargily → vérif HMAC ✅ → Supabase → n8n
```

**Passer en production :**
1. Remplacer `CHARGILY_SECRET_KEY` dans Vercel par la clé prod
2. Changer URL dans `/api/checkout/route.ts` : `pay.chargily.net/test/` → `pay.chargily.net/`

---

### NFC Android (Web NFC API)
- API : `NDEFReader` (Chrome Android 89+) — fallback saisie manuelle toujours présent
- iOS non supporté

### PWA
- Manifest : `/public/manifest.json` — scope `/carte`
- SW : network-first + fallback cache — cache name `hadiya-v1`
- Icônes statiques Hadiya (pas dynamiques par salon)

### n8n (WhatsApp / Email)
- Déclenché par webhook Chargily après paiement confirmé
- Variable : `N8N_WEBHOOK_URL` (optionnel — graceful fallback)
- Payload : `{ phone, email, prenom, nom, montant, message, offertPar, carteId }`
- **Config requise :** n8n Cloud (~20$/mois) + UltraMsg (~15$/mois) + WhatsApp Business

---

## 5. VARIABLES D'ENVIRONNEMENT

| Variable | Requis | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Oui | URL projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Oui | Clé anonyme Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Oui | Clé service (webhook + employes/create) |
| `CHARGILY_SECRET_KEY` | Oui | Clé secrète Chargily (`test_sk_...` en test) |
| `NEXT_PUBLIC_URL` | Oui | URL base app (`http://localhost:3000` en dev) |
| `N8N_WEBHOOK_URL` | Non | URL webhook n8n |

---

## 6. SCHEMA BASE DE DONNÉES
> Détail complet et vérifié dans `SUPABASE.md`

| Table | Colonnes clés |
|---|---|
| `salons` | id, owner_id, nom, slug, logo_url, fidelite_actif, points_par_100da, seuils, avantages_fidelite |
| `employes` | id, salon_id, user_id, prenom, nom, role, permissions(jsonb), actif |
| `clients` | id, salon_id, prenom, nom, telephone, points, niveau, allergies, preferences_massage, notes_praticien |
| `cartes` | id, salon_id, client_id, uid_rfid, type, solde, points, niveau, statut, source, date_expiration |
| `transactions` | id, salon_id, carte_id, type, montant, points_gagnes, description |
| `menu_items` | id, salon_id, nom, emoji, prix, categorie, actif, duree_minutes, stock_actuel, stock_minimum, stock_unite |
| `notifications` | id, salon_id, type, titre, message, lu, meta |
| `scans` | id, salon_id, carte_id, employe_id |
| `reservations` | id, salon_id, client_id, service_id, employe_id, date_heure, duree_minutes, statut, notes |

**Backfills appliqués (2026-05-16) :** transactions(33), scans(12), menu_items, clients, employes, cartes

---

## 7. CHECKLIST SESSION EN COURS 🎯

> **Workflow :** Au début de chaque session, lire cette section et présenter les tâches en attente. Cocher immédiatement quand c'est terminé.

### En attente
- [ ] **Passer Chargily en production** — `CHARGILY_SECRET_KEY` Vercel + URL `/api/checkout/route.ts` (en attente des clés)
- [ ] **n8n WhatsApp** — `N8N_WEBHOOK_URL` dans Vercel + workflow n8n
- [x] **Sous-catégories soins** — bannière alerte dans Produits > Soins pour identifier et reclassifier les soins legacy

### ✅ Fait session 2026-05-16
- [x] Isolation multi-salon complète — toutes les pages filtrent par `salon_id`
- [x] SQL backfills — transactions(33), scans(12), menu_items, clients, employes, cartes
- [x] Logo salon — upload Storage bucket `logos`, affiché gift-card/[slug] + dashboard + carte/[uid]
- [x] Footer "by Hadiya" sur pages publiques
- [x] Fix création employé — API route `/api/employes/create` (service role, salon_id correct)
- [x] Réservations — agenda Jour/Semaine/Mois, modal PC centré, nouveau client → table clients
- [x] Produits — refonte soins (sous-catégories + durée) vs consommables (stock)
- [x] SUPABASE.md — schéma vérifié et documenté
- [x] Sécurité Paramètres — changement MDP, sessions actives, déconnexion globale
- [x] Impression reçu caisse — ticket thermique 80mm
- [x] Statistiques — export CSV (BOM UTF-8)

---

## 8. BACKLOG ⏳

### Bugs connus
- [ ] `SUPABASE_SERVICE_ROLE_KEY` absent `.env.local` → webhook Chargily crashe en local
- [ ] Turbopack désactivé — cause non identifiée (conflit Tailwind 4?)

### Fonctionnalités
- [ ] Page commandes/commande_items — tables créées, pages manquantes
- [ ] Mode offline — SW cache shell uniquement, données Supabase non cachées
- [ ] Notifications push PWA
- [ ] Export PDF tickets / historique client

---

## 9. COMMANDES UTILES

```bash
npm run dev                                    # dev (webpack)
npm run build                                  # vérifier erreurs TS
git add <fichiers> && git commit -m "..." && git push origin master
```

---

## 10. URLs IMPORTANTES

| Service | URL |
|---|---|
| App locale | `http://localhost:3000` |
| Supabase SQL Editor | Supabase Dashboard → SQL Editor |
| Chargily test dashboard | `https://pay.chargily.net/test/dashboard` |
| Chargily webhooks | Chargily Dashboard → Développeurs → Webhooks |
| Chargily API prod | `https://pay.chargily.net/api/v2/` |

---

## 11. DESIGN SYSTEM

| Token | Hex | Usage |
|---|---|---|
| Fond crème | `#F7F4EE` | Fond principal |
| Fond sombre | `#2C2A25` | Dashboard dark |
| Fond profond | `#1E1C18` | Inputs, cartes |
| Or accent | `#BA7517` | CTA, hover, bordures |
| Pierre | `#8A8275` | Textes secondaires |

**Polices :** Cormorant Garamond (titres serif) + Geist Sans (corps)

**Classes utilitaires globals.css :** `.hd-input` `.hd-card` `.hd-btn` `.hd-btn-gold` `.hd-back` `.hd-amount` `.hd-menu-item` `.hd-row` `.hd-fade` `.hd-stat`

---

*Mis à jour à chaque session — schéma Supabase détaillé dans `SUPABASE.md`*
