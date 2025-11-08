# Golf Coaching Admin - In-App Messages

Interface d'administration pour gérer les messages in-app de l'application mobile Golf Coaching.

## Fonctionnalités

- Liste des messages avec filtres
- Création et édition de messages
- Upload de liste userIds (CSV/JSON) pour ciblage
- Prévisualisation des messages
- Gestion des dates d'activation
- Statistiques de vues/fermetures
- Authentification sécurisée avec Supabase (accès réservé à l’administrateur)

## Installation

```bash
npm install
```

## Configuration

1. Copiez `.env.local.example` vers `.env.local`
2. Remplissez les variables d'environnement :
   - `NEXT_PUBLIC_SUPABASE_URL` : URL de votre projet Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` : Clé publique (anon) utilisée par le client pour l’authentification Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` : Clé service role Supabase (utilisée uniquement dans les routes API côté serveur)
   - `ADMIN_EMAIL` : Email du compte Supabase autorisé à accéder à l’interface

⚠️ **Important**

- La clé service role ne doit **jamais** être exposée côté client.
- `ADMIN_EMAIL` doit correspondre exactement au compte Supabase que vous utiliserez pour vous connecter via `/login`.

## Développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Build

```bash
npm run build
npm start
```

## Structure

- `/pages` : Pages Next.js
  - `/pages/api` : Routes API sécurisées (service role Supabase)
  - `/pages/login.tsx` : Page de connexion administrateur
- `/lib` : Utilitaires (clients Supabase, helpers d’authentification)
- `/types` : Types TypeScript

