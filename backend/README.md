# CDIP Backend API

Express.js REST API for the Campus Dining Intelligence Platform.

## Setup

```bash
npm install
cp .env.example .env
# Edit DATABASE_URL in .env

npx prisma migrate dev
npx prisma db seed
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run production build |
| `npm test` | Run unit tests |
| `npm run prisma:studio` | Open Prisma Studio |

## Architecture

```
src/
├── auth/           # JWT auth service
├── analytics/      # Dashboard & report analytics
├── config/         # Environment & database
├── controllers/    # Request handlers
├── emails/         # Nodemailer service
├── logger/         # Winston logger
├── middlewares/    # Auth, validation, tenant guard
├── routes/         # Express routes
├── services/       # Business logic
├── storage/        # Multer file uploads
├── types/          # TypeScript types
├── utils/          # Helpers
└── validators/     # Zod schemas
```

## API Base URL

`http://localhost:5000/api/v1`

Swagger documentation: `http://localhost:5000/api-docs`

## RBAC Matrix

| Endpoint | Super Admin | College Admin | Warden | Operator | Student |
|----------|:-----------:|:-------------:|:------:|:--------:|:-------:|
| Colleges CRUD | ✅ | ❌ | ❌ | ❌ | ❌ |
| Hostels | ✅ | ✅ | ❌ | ❌ | ❌ |
| Students | ❌ | ✅ | ✅ | ❌ | ❌ |
| Menus | ❌ | ✅ | ✅ | ✅ | 👁️ |
| Ratings | ❌ | ❌ | ❌ | 👁️ | ✅ |
| Complaints | ❌ | ✅ | ✅ | 👁️ | ✅ |
| Analytics | 🌐 | ✅ | ✅ | ❌ | ❌ |
| Reports | ❌ | ✅ | ✅ | ❌ | ❌ |

## Multi-Tenant Isolation

All college-scoped queries filter by `collegeId` from JWT. Super Admin bypasses tenant filter for global operations.
