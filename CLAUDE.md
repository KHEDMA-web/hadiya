@AGENTS.md

# Projet Hadiya

## Contexte
Hadiya est un SaaS B2B de cartes cadeaux digitales, fidélité et caisse POS pour salons spa en Algérie.

## Stack technique
- Next.js 14 + TypeScript + Tailwind CSS
- Supabase (base de données + auth)
- Vercel (hébergement)
- n8n (automatisations WhatsApp)

## Design System
- Fond principal : #F7F4EE (crème)
- Fond sombre : #2C2A25 (dark)
- Accent or : #BA7517
- Pierre : #8A8275
- Style : luxe spa premium, minimaliste, typographie serif pour les titres
- Composants : coins arrondis (rounded-2xl), ombres douces, espacements généreux

## Base de données Supabase
Tables : salons, clients, cartes, transactions, menu_items, commandes, commande_items

## Pages existantes
- /login → authentification salon
- /dashboard → vue d'ensemble stats + actions
- /dashboard/cartes/nouvelle → créer carte cadeau
- /dashboard/scanner → scanner QR + débiter solde
- /dashboard/caisse → caisse POS
- /dashboard/clients → liste clients
- /dashboard/recharge → recharger solde carte
- /dashboard/historique → historique transactions
- /carte/[uid] → carte client mobile (publique)

## Règles importantes
- Toujours utiliser le client Supabase depuis @/lib/supabase
- Les pages dashboard nécessitent une session auth
- Le marché cible est l'Algérie — montants en DA
- WhatsApp est le canal de communication principal (pas SMS)
- Compatibilité mobile prioritaire
## Skills & Plugins actifs
- frontend-design : UI/UX premium, composants élégants, design system
- Priorité mobile first sur toutes les pages
- Utiliser des composants réutilisables
- Code propre et typé TypeScript strict
- Pas de inline styles — utiliser Tailwind uniquement
- Accessibilité : contraste suffisant, labels sur les inputs
- Performance : pas de re-renders inutiles