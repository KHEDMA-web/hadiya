# HADIYA — STATUS PROJET
> Dernière mise à jour : 2026-05-16 — v6

---

## CHECKLIST SESSION EN COURS 🎯

> **Workflow :** Au début de chaque session, lire cette section et présenter les tâches en attente. Cocher immédiatement quand c'est terminé.

### En attente
- [ ] **Passer Chargily en production** — `CHARGILY_SECRET_KEY` dans Vercel + URL dans `/api/checkout/route.ts` : `pay.chargily.net/test/` → `pay.chargily.net/` (en attente des clés)
- [ ] **n8n WhatsApp** — `N8N_WEBHOOK_URL` dans Vercel env + workflow n8n (trigger webhook → WhatsApp bénéficiaire)
- [ ] **Sous-catégories soins** — éditer les 4 soins (categorie=`soin` legacy) dans Produits pour assigner massage/soin_visage/etc.

### Fait session 2026-05-16
- [x] Isolation multi-salon — toutes les pages filtrent par `salon_id`
- [x] SQL backfills — transactions(33), scans(12), menu_items, clients, employes, cartes
- [x] Logo salon — upload Storage bucket `logos`, affiché sur gift-card/[slug], dashboard, carte/[uid]
- [x] Footer "by Hadiya" sur pages publiques
- [x] Fix création employé — API route `/api/employes/create` (service role, salon_id correct, session propriétaire préservée)
- [x] Réservations — page agenda avec vues Jour/Semaine/Mois, modal PC centré, nouveau client → table clients
- [x] Produits — refonte complète : soins (sous-catégories + durée) vs consommables (stock/seuil/unité), recherche, dupliquer, 4 actions
- [x] SUPABASE.md — schéma vérifié et documenté

---

## STRUCTURE FICHIERS (pages)

```
src/app/
├── login/ · register/
├── carte/[uid]/                ← publique PWA
├── gift-card/[slug]/           ← paiement branded par salon
├── gift-card/success/ · echec/
├── scan/
├── dashboard/
│   ├── page.tsx                ← stats + RFID realtime
│   ├── scanner/ · caisse/ · recharge/
│   ├── clients/ · clients/[id]/
│   ├── produits/               ← soins + consommables ✅ refondu
│   ├── reservations/           ← agenda Jour/Semaine/Mois ✅ nouveau
│   ├── statistiques/ · transactions/ · notifications/
│   ├── cartes/nouvelle/
│   └── admin/ · admin/employes/ · admin/parametres/
└── api/
    ├── checkout/               ← POST Chargily
    ├── webhook/chargily/       ← POST webhook paiement
    └── employes/create/        ← POST création employé (service role)
```

---

## BACKLOG ⏳

### Bugs connus
- [ ] `SUPABASE_SERVICE_ROLE_KEY` absent `.env.local` → webhook Chargily crashe en local
- [ ] Turbopack désactivé — cause non identifiée (conflit Tailwind 4?)
- [ ] Middleware passif — délègue redirection au client si pas de token

### Fonctionnalités
- [ ] Mode offline — SW cache shell uniquement, données Supabase non cachées
- [ ] Page commandes/commande_items — tables créées, pages manquantes
- [ ] Notifications push (PWA)
- [ ] Export PDF tickets / historique client

### n8n — Ce qu'il faut
1. Héberger n8n (cloud ~20$/mois ou VPS ~5-10$/mois)
2. API WhatsApp : UltraMsg (~15$/mois), Wassenger (~25$/mois) ou 360dialog (~50€/mois)
3. Compte WhatsApp Business dédié
- Payload déjà envoyé par le webhook : `{ phone, email, prenom, nom, montant, message, offertPar, carteId }`

---

## COMMANDES UTILES

```bash
npm run dev          # dev (webpack)
npm run build        # vérifier erreurs TS
git add <fichiers> && git commit -m "feat: ..." && git push origin master
```

---

## URLS

| Service | URL |
|---|---|
| App locale | `http://localhost:3000` |
| Supabase SQL Editor | Supabase Dashboard → SQL Editor |
| Chargily test | `https://pay.chargily.net/test/dashboard` |
| Chargily webhooks | Chargily Dashboard → Développeurs → Webhooks |
