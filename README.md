# Kirana Connect

Nearby product discovery and price comparison MVP.

## Stack

React (JavaScript) - Vite - Tailwind CSS - GSAP - React Router - TanStack Query -
Zustand - React Hook Form - Zod - Lucide React - Supabase JS - Leaflet / React Leaflet

Primary font: Parkinsans (Google Fonts), falling back to `system-ui, sans-serif`.

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

Fill `.env` with your Supabase project values:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Scripts

- `npm run dev` - start the dev server
- `npm run build` - production build
- `npm run preview` - preview the production build
- `npm run lint` - run oxlint

## Structure

```
src/
  animations/   assets/     components/  features/
  hooks/        layouts/    lib/         pages/
  routes/       services/   store/       utils/
```

## Conventions

- Icons come from `lucide-react` only. No emojis, no other icon packs.
