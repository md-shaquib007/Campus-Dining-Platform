# CDIP Frontend

React 19 SPA for the Campus Dining Intelligence Platform.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- TanStack Query for server state
- React Hook Form + Zod for forms
- Recharts for analytics
- Framer Motion for transitions
- React Hot Toast for notifications

## Structure

```
src/
├── api/           # Axios client & API functions
├── components/    # Reusable UI components
├── contexts/      # Auth & Theme providers
├── layouts/       # Dashboard & Auth layouts
├── pages/         # Route pages
├── routes/        # React Router config
├── types/         # TypeScript interfaces
└── utils/         # Helpers
```

## Demo Login

- Student: `student@demo.edu` / `Student@123`
- Admin: `admin@demo.edu` / `Admin@123`
