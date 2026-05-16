# Supabase — Hadiya (vérifié 2026-05-16 v7)

## Tables & colonnes

**salons** — id · owner_id · nom · slug(unique) · logo_url · fidelite_actif(bool) · points_par_100da(int) · seuil_argent/or/platine(int) · avantages_fidelite(jsonb)

**employes** — id · salon_id · prenom · nom · email · telephone · role(caissier/receptionniste/manager/praticien) · permissions(jsonb) · actif(bool)
- `praticien` : masseuses/masseurs — pas de compte app, pas d'email, contact téléphone uniquement

**clients** — id · salon_id · prenom · nom · telephone · date_naissance(date) · points(int) · niveau · allergies · preferences_massage · notes_praticien

**cartes** — id · salon_id · uid_rfid · type(cadeau/fidelite) · solde · points · niveau · statut · message_perso · offert_par · date_expiration · source(online/comptoir) · first_opened_at

**transactions** — id · salon_id · carte_id · type · montant · points_gagnes · description · created_at

**menu_items** — id · salon_id · nom · emoji · prix(numeric) · categorie · actif(bool) · duree_minutes(int) · stock_actuel(int) · stock_minimum(int) · stock_unite(text)
- categorie : `consommable` | `massage` | `soin_visage` | `corps` | `manucure` | `coiffure` | `autre` | `soin`(legacy)
- Réservations : exclure `categorie = consommable`

**notifications** — id · salon_id · type · titre · message · lu(bool) · meta(jsonb) · created_at

**scans** — id · salon_id · carte_id · employe_id · created_at

**reservations** — id · salon_id · client_id(fk clients) · service_id(fk menu_items) · employe_id(fk employes) · date_heure(timestamptz) · duree_minutes(int) · statut(en_attente/confirme/annule/termine) · notes · nom_client(legacy) · telephone_client(legacy)

**commandes** / **commande_items** — tables existantes, pages non créées

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

## Règle
**Après chaque modif Supabase (table/colonne/bucket/policy), mettre à jour ce fichier.**
