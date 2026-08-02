# Supabase — Hadiya (vérifié 2026-07-22 v9)

## ⚠️ Migration 2026-07-22
Ancien projet (`ecktzgxixqvqdwijyezy`, compte `anis.khelifi1608@gmail.com`) mis en pause par Supabase (inactivité, plan Free) puis bloqué par la limite d'1 projet actif/compte. Migration vers un **nouveau projet** (`kxuuwvedfbgirrakzovq`, compte `khelifi.anis2020@gmail.com`, org Free, région `eu-west-2`).
- Base recréée **vide** (schéma identique via script SQL) — anciennes données (clients/cartes/transactions réelles) restées sur l'ancien projet, récupérables jusqu'au 27/09/2026 si besoin.
- Anciens comptes `auth.users` non migrés — recréer via `/register`.
- `.env.local` et variables Vercel mis à jour avec les nouvelles clés (`sb_publishable_...` / `sb_secret_...`, format nouvelle génération Supabase).
- Ancien projet resté en pause — penser à upgrader vers Pro ou supprimer un projet inutile si besoin de le reprendre plus tard.

## Tables & colonnes
> Vérifié 2026-07-22 par audit exhaustif du code (tous les `.from('table')` de `src/`) — remplace toute doc précédente qui était partiellement obsolète.

**salons** — id · owner_id(fk auth.users) · **email**(lookup principal — middleware/auth.ts/fidelite.ts font `.eq('email', ...)`, PAS owner_id) · nom · slug(unique) · telephone · whatsapp · wilaya · logo_url · abonnement(text, jamais écrit par le code — futur billing) · fidelite_actif(bool) · points_par_100da(int) · seuil_argent/or/platine(int) · avantages_fidelite(jsonb)

**employes** — id · salon_id · **user_id**(fk auth.users, nullable — utilisé par `middleware.ts` pour les permissions) · prenom · nom · email(nullable) · telephone · role(caissier/receptionniste/manager/praticien) · permissions(jsonb) · actif(bool)
- `praticien` : masseuses/masseurs — pas de compte app → `user_id` reste null

**clients** — id · salon_id · prenom · nom · telephone · **email**(nullable) · date_naissance(date) · points(int) · niveau · allergies · preferences_massage · notes_praticien

**cartes** — id · salon_id · **client_id**(fk clients) · uid_rfid(unique) · type(cadeau/fidelite) · solde · points · niveau(⚠️ casse incohérente : `Bronze/Argent/Or/Platine` partout sauf `reservations/page.tsx` qui insère `'bronze'` minuscule) · statut · message_perso · offert_par · date_expiration · source(online/comptoir) · first_opened_at

**transactions** — id · salon_id(optionnel selon call site) · carte_id · type · montant · points_gagnes · description · created_at

**menu_items** — id · salon_id · nom · emoji · prix(numeric) · **cout**(numeric, nullable — lu par `statistiques/page.tsx` pour le bénéfice mais **jamais renseigné** par `produits/page.tsx`, aucun formulaire ne l'édite) · categorie · actif(bool) · duree_minutes(int) · stock_actuel(int) · stock_minimum(int) · stock_unite(text)
- categorie : `consommable` | `massage` | `soin_visage` | `corps` | `manucure` | `coiffure` | `autre` | `soin`(legacy)
- Réservations : exclure `categorie = consommable`

**notifications** — id · salon_id(optionnel) · type · titre · message · lu(bool) · meta(jsonb) · created_at

**scans** — id · salon_id(**nullable**) · carte_id(nullable) · employe_id(nullable) · **uid_carte**(text, nullable) · created_at
- ⚠️ En pratique seul `src/app/scan/page.tsx` écrit dans cette table, et il n'insère QUE `{ uid_carte }` — pas salon_id/carte_id/employe_id. `dashboard/scanner/page.tsx` n'écrit jamais dans `scans` (il agit directement sur `cartes`/`transactions`). Colonnes `carte_id`/`employe_id`/`salon_id` gardées pour compat mais jamais peuplées par le code actuel.

**reservations** — id · salon_id · client_id(fk clients) · service_id(fk menu_items) · employe_id(fk employes, nullable) · date_heure(timestamptz) · duree_minutes(int) · statut(en_attente/confirme/annule/termine) · notes · nom_client(legacy, jamais lu) · telephone_client(legacy, jamais lu)

**commandes** — id · salon_id · client_id(fk clients) · carte_id(fk cartes) · total(numeric) · statut · created_at
- ⚠️ Doc précédente disait "pages non créées" — **faux**, activement utilisée par `dashboard/caisse/page.tsx` (insert) et `dashboard/commandes/page.tsx` (lecture)

**commande_items** — id · commande_id(fk commandes) · menu_item_id(fk menu_items, nullable) · **nom**(text, dénormalisé) · **prix**(numeric, dénormalisé — c'est la colonne réellement insérée par `caisse/page.tsx`) · **emoji**(text, dénormalisé) · quantite(int) · prix_unitaire(numeric, ⚠️ jamais insérée par aucun code mais lue par `statistiques/page.tsx` — bug applicatif préexistant, la section "Produits & bénéfices" des Statistiques calcule toujours 0 pour `ca`/`benefice`, colonne gardée pour compat schéma seulement)

## Isolation multi-salon
- Toutes les tables ont `salon_id` — toujours `.eq('salon_id', salonId)`
- Backfills appliqués 2026-05-16 : transactions(33), scans(12), menu_items, clients, employes, cartes

## Storage
- Bucket `logos` (public) · path `{salonId}.{ext}` · URL stockée dans `salons.logo_url`

## Realtime
`scans` INSERT · `notifications` INSERT · `cartes` UPDATE · `transactions` INSERT

## Auth
- Owner : `salons.owner_id = auth.uid()`
- Employé : `employes.permissions` (jsonb) — 9 permissions
- Service Role Key : webhook Chargily uniquement (bypass RLS) · route `/api/employes/create`

## RLS Policies notables
- `reservations` : owner (via `salons.owner_id`) + employé actif du salon (`employes.salon_id + actif`)
- `cartes`, `transactions`, `salons`, `clients` : SELECT public (`using (true)`) — le modèle de sécurité de l'app repose sur la possession de l'UUID `uid_rfid` (non devinable), pas sur RLS. Requis par `/carte/[uid]` (public, sans login) et par `dashboard/scanner` (qui lookup par `uid_rfid` sans filtrer par `salon_id`). `cartes` a aussi une policy UPDATE publique (`using (true) with check (true)`) pour la recharge/débit/first_opened_at/association RFID.
- ⚠️ **2026-08-02 — bug corrigé** : ces policies SELECT/UPDATE sur `cartes` (et SELECT sur `transactions`/`salons`/`clients`) étaient absentes après la migration du 2026-07-22 (script de recréation du schéma incomplet), causant "Carte introuvable" à la fois sur la page publique et sur le scanner dashboard authentifié. Policies recréées manuellement via SQL Editor.

## Règle
**Après chaque modif Supabase (table/colonne/bucket/policy), mettre à jour ce fichier.**
