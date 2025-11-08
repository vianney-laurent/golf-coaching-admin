# Golf Coaching Admin - In-App Messages

Interface d'administration pour gérer les messages in-app de l'application mobile Golf Coaching.

## Fonctionnalités

- Liste des messages avec filtres
- Création et édition de messages
- Upload de liste userIds (CSV/JSON) pour ciblage
- Prévisualisation des messages
- Gestion des dates d'activation
- Statistiques de vues/fermetures

## Installation

```bash
npm install
```

## Configuration

1. Copiez `.env.local.example` vers `.env.local`
2. Remplissez les variables d'environnement :
   - `NEXT_PUBLIC_SUPABASE_URL` : URL de votre projet Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` : Clé service role de Supabase (pour accès admin)

⚠️ **Important** : La clé service role ne doit JAMAIS être exposée côté client. Elle est utilisée uniquement dans les API routes Next.js.

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
- `/components` : Composants React
- `/lib` : Utilitaires et services (Supabase client, etc.)
- `/types` : Types TypeScript

