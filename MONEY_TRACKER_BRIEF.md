# Brief — Money Tracker (suivi dépenses pro / achat-revente)

> À copier-coller dans une nouvelle session Claude Code ayant accès au repo `KHEDMA-web/money-tracker`. Ce repo est vide (ou quasi) — c'est un nouveau projet, indépendant de Hadiya.

## Contexte

Le client gère une activité d'achat-revente (ex : montres, voitures, etc.) et a besoin d'une app pour suivre chaque article acheté/revendu : combien il l'a payé, combien il l'a revendu, sa marge, et plein de KPIs sur l'ensemble de son activité.

C'est un projet **mono-utilisateur** (un seul client, pas de multi-tenant comme Hadiya).

## Stack à utiliser

- Next.js (dernière version stable) + TypeScript strict + Tailwind CSS
- Supabase (nouveau projet Supabase séparé, **pas celui de Hadiya**) pour la DB + auth simple
- Recharts pour les graphiques KPIs
- Déploiement Vercel
- Authentification simple : un seul compte (email/password via Supabase Auth), pas de gestion de rôles/permissions complexe

## Fonctionnalité principale : Ajouter une dépense

Bouton "+ Ajouter une dépense" (visible partout, FAB ou bouton header) ouvrant un formulaire :
- **Catégorie** — menu déroulant (ex : Montres, Voitures, Sneakers, Électronique...) + possibilité de créer une nouvelle catégorie à la volée
- **Nom / description de l'article** (texte libre, ex : "Rolex Submariner 116610")
- **Prix d'achat** (DA, obligatoire)
- **Prix de revente** (DA, optionnel — vide si l'article n'est pas encore revendu)
- **Date d'achat**
- **Date de revente** (optionnel, affiché seulement si prix de revente renseigné)
- **Statut** — déduit automatiquement : `en_stock` si pas de prix de revente, `vendu` sinon
- **Notes** (optionnel)

## Historique

Page listant toutes les dépenses, avec :
- Tri par date (plus récent en premier)
- Filtres : par catégorie, par statut (en stock / vendu)
- Recherche par nom d'article
- Affichage par ligne : catégorie, nom, prix achat, prix revente, marge (calculée), statut, dates
- Édition / suppression d'une entrée

## Gestion des catégories

Page simple CRUD : créer / renommer / supprimer une catégorie (avec emoji ou icône optionnelle, comme dans Hadiya `produits`).

## KPIs (dashboard principal)

- **Total investi** = somme des prix d'achat (tous statuts)
- **Total des ventes** = somme des prix de revente (articles vendus uniquement)
- **Profit total** = total des ventes − coût d'achat des articles vendus
- **Marge moyenne (%)** = profit moyen / prix d'achat moyen sur les articles vendus
- **ROI global** = profit total / total investi sur les articles vendus
- **Nombre d'articles en stock** vs **vendus**
- **Valeur du stock actuel** (somme prix d'achat des articles en `en_stock`)
- **Profit par catégorie** (graphique barres, Recharts)
- **Évolution du profit dans le temps** (graphique courbe, par mois, Recharts)
- **Temps moyen de détention** (date revente − date achat, moyenne en jours)
- **Top 5 meilleures ventes** (plus gros profit en valeur absolue)
- **Catégorie la plus rentable** (mise en avant)

## Schéma Supabase (proposition)

```sql
categories
  id uuid pk
  nom text
  emoji text
  created_at timestamptz

depenses
  id uuid pk
  categorie_id uuid fk -> categories
  nom_article text
  prix_achat numeric
  prix_revente numeric nullable
  statut text  -- 'en_stock' | 'vendu' (calculé/maintenu côté app)
  date_achat date
  date_revente date nullable
  notes text nullable
  created_at timestamptz
```

RLS : un seul utilisateur (owner), policy simple `auth.uid() = owner_id` si on ajoute une colonne `owner_id`, ou pas de RLS du tout si l'app n'a vraiment qu'un seul compte et que la clé anon n'est jamais exposée publiquement (à évaluer selon si l'app est publique ou non).

## Structure de pages suggérée

```
src/app/
├── login/page.tsx
├── dashboard/
│   ├── page.tsx              ← KPIs + graphiques
│   ├── historique/page.tsx   ← liste + filtres
│   ├── categories/page.tsx   ← gestion catégories
│   └── _components/
│       ├── AjouterDepenseModal.tsx
│       └── KpiCard.tsx
└── api/ (si besoin de routes serveur, sinon tout via client Supabase)
```

## Design

Pas besoin de reprendre le thème "spa luxe" de Hadiya (couleurs or/crème) — c'est un client différent. Proposer un design neutre et clean (ex : fond clair, accent une seule couleur sobre, `rounded-2xl`, cards avec ombre douce). Mobile-first puisque le client va probablement ajouter ses dépenses depuis son téléphone.

## Étapes pour démarrer

1. Cloner/initialiser le repo `KHEDMA-web/money-tracker`
2. `npx create-next-app@latest` (TypeScript, Tailwind, App Router, pas de `src/` géré automatiquement si on veut suivre la même convention que Hadiya)
3. Créer un nouveau projet Supabase, configurer `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Créer les tables `categories` et `depenses` via SQL Editor Supabase
5. Implémenter login simple, dashboard KPIs, historique, ajout dépense, gestion catégories
6. Déployer sur Vercel

## Variables d'environnement

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   # si besoin d'opérations admin plus tard
```
