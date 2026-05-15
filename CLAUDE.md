@AGENTS.md

# Projet Hadiya

## Contexte
SaaS B2B de cartes cadeaux digitales, fidélité et caisse POS pour salons spa en Algérie.
Marché : Algérie — montants en DA — WhatsApp canal principal (pas SMS).
Mobile first, design luxe spa premium.

## Stack (versions exactes)
- **Next.js 16.2.4** + TypeScript strict + Tailwind CSS 4
- **React 19.2.4**
- **Supabase** : @supabase/supabase-js ^2.105.3 + @supabase/ssr ^0.10.3
- **Recharts** ^3.8.1 (graphiques)
- **qrcode** ^1.5.4 + **html5-qrcode** ^2.3.8 (scan caméra)
- Vercel (hébergement) · n8n (automatisations WhatsApp/email)
- Paiement : **Chargily Pay API v2** (mode test actuellement)
- Bundler : Webpack (`next dev --webpack`) — NE PAS utiliser Turbopack

## Design System
```
#F7F4EE  fond crème (principal)
#2C2A25  fond sombre (dashboard)
#1E1C18  fond profond (inputs, cartes)
#BA7517  or accent (CTA, hover, bordures)
#8A8275  pierre (textes secondaires)
```
- Polices : Cormorant Garamond (serif titres) + Geist Sans (corps)
- Composants : `rounded-2xl`, ombres douces, espacements généreux
- Classes utilitaires dans `globals.css` : `.hd-input` `.hd-card` `.hd-btn` `.hd-btn-gold` `.hd-back` `.hd-amount` `.hd-menu-item` `.hd-row` `.hd-fade` `.hd-stat`
- PAS de inline styles — Tailwind uniquement
- Accessibilité : contraste suffisant, labels sur tous les inputs

## Structure src/
```
src/
├── app/
│   ├── layout.tsx / page.tsx / globals.css
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── scan/page.tsx
│   ├── carte/page.tsx + carte/[uid]/page.tsx        ← publique, PWA
│   ├── gift-card/page.tsx + success/ + echec/
│   ├── gift-card/[slug]/page.tsx                    ← page paiement par salon (branded)
│   ├── dashboard/
│   │   ├── page.tsx                            ← RFID realtime + stats
│   │   ├── _components/BackButton.tsx
│   │   ├── _components/ClientModal.tsx          ← 4 onglets
│   │   ├── scanner/ caisse/ recharge/
│   │   ├── clients/ + clients/[id]/
│   │   ├── produits/ statistiques/ transactions/
│   │   ├── notifications/ cartes/nouvelle/
│   │   └── admin/ + admin/employes/ + admin/parametres/
│   └── api/
│       ├── checkout/route.ts                   ← POST Chargily
│       └── webhook/chargily/route.ts           ← POST webhook paiement
├── lib/
│   ├── supabase.ts   ← TOUJOURS importer depuis ici
│   ├── auth.ts       ← getUserProfile(), types Permissions, UserProfile
│   └── fidelite.ts   ← calcPoints(), getNiveau(), getProgressionNiveau()
└── middleware.ts      ← permissions par route
```

## Règles Supabase
- Client : TOUJOURS `import { supabase } from '@/lib/supabase'`
- Webhook (`/api/webhook/chargily`) : utilise `createClient` avec `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS)
- Realtime actif sur : `scans` (INSERT) · `notifications` (INSERT) · `cartes` (UPDATE) · `transactions` (INSERT)
- `clients.salon_id` et `salons.slug` sont présents en DB

## Base de données (tables)
`salons` `employes` `clients` `cartes` `transactions` `menu_items` `notifications` `scans`

Colonnes clés :
- `cartes` : uid_rfid, type(cadeau/fidelite), solde, points, niveau, statut, message_perso, offert_par, date_expiration, source(online/comptoir), first_opened_at
- `clients` : telephone(lookup unique), niveau, points, allergies, preferences_massage, notes_praticien, salon_id
- `employes` : permissions(jsonb), actif, role(caissier/receptionniste/manager)
- `salons` : owner_id, slug(unique), fidelite_actif, points_par_100da, seuil_argent/or/platine, avantages_fidelite(jsonb)

## Auth & Permissions
- Owner : `salons.owner_id === auth.user.id` → toutes permissions
- Employé : permissions dans `employes.permissions` (jsonb)
- 9 permissions : dashboard · caisse · scanner · clients · recharge · produits · statistiques · transactions · admin
- `getUserProfile()` dans `src/lib/auth.ts` retourne `UserProfile | null`

## Intégrations
- **Chargily** : POST `/api/checkout` → redirect → webhook `/api/webhook/chargily` → créer client+carte+transaction+notification → déclencher n8n
  - Webhook sécurisé : vérification signature HMAC sha256 (header `signature`) via `timingSafeEqual`
  - Mode TEST actuellement — URL `pay.chargily.net/test/api/v2/` → changer en prod
- **Page paiement par salon** : `/gift-card/[slug]` — chaque salon a son URL unique configurée dans Paramètres → Salon
- **NFC** : `NDEFReader` API (Chrome Android 89+) dans `/dashboard/caisse` — fallback manuel toujours présent
- **PWA** : manifest `/public/manifest.json` (scope `/carte`) + SW `/public/sw.js` (network-first)
- **n8n** : déclenché si `process.env.N8N_WEBHOOK_URL` défini — non bloquant (`.catch(() => {})`)

## Variables d'environnement
```
NEXT_PUBLIC_SUPABASE_URL        # Supabase → Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Supabase → Settings → API
SUPABASE_SERVICE_ROLE_KEY       # Supabase → Settings → API (webhook uniquement)
CHARGILY_SECRET_KEY             # Chargily → Développeurs (test_sk_... en test)
NEXT_PUBLIC_URL                 # http://localhost:3000 en dev
N8N_WEBHOOK_URL                 # optionnel
```

## Points d'attention / Bugs connus
- ~~Webhook Chargily : PAS de vérification signature HMAC~~ → ✅ corrigé
- Chargily en mode TEST — URL `pay.chargily.net/test/api/v2/` à changer en prod quand clés reçues
- Middleware passif : délègue la redirection au client si pas de token
- Pas de bouton logout dans le dashboard
- `commandes` et `commande_items` référencées dans le schéma mais pages non créées

## Workflow session
Au début de chaque session, lire la section "CHECKLIST SESSION EN COURS" dans `HADIYA_STATUS.md` et présenter les tâches en attente à l'utilisateur. Quand une tâche est terminée, la cocher dans le fichier immédiatement.

## Conventions de code
- TypeScript strict — pas de `any`
- Pas de commentaires sauf si le WHY est non-obvious
- Composants réutilisables dans `dashboard/_components/`
- Pas de re-renders inutiles
- Performance mobile prioritaire
