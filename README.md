# Campus Dining Intelligence Platform (CDIP)

A production-ready, multi-tenant SaaS platform for collecting, analyzing, and acting on campus dining feedback. Built with the MERN stack and TypeScript.

## Features

- **Multi-tenant architecture** — Each college is fully isolated
- **Role-based access** — Super Admin, College Admin, Warden, Mess Operator, Student
- **Daily meal ratings** — 7 criteria (taste, quality, quantity, hygiene, variety, temperature, overall)
- **Reviews & complaints** — With optional anonymity and photo uploads
- **Meal skip tracking** — Reduce food wastage
- **Polls & suggestions** — Student engagement and menu planning
- **Analytics dashboards** — Recharts-powered insights for all roles
- **Report exports** — PDF, Excel, CSV
- **AI-ready architecture** — Modular design for future ML features

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, TypeScript, Vite, Tailwind, ShadCN UI, TanStack Query, Recharts |
| Backend | Node.js, Express, TypeScript, Prisma, PostgreSQL |
| Auth | JWT + Refresh Tokens, Bcrypt, RBAC |
| DevOps | Docker, Docker Compose, Neon PostgreSQL |

## What's New in v2.0 (Production Ready)

- **Hashed refresh tokens** — tokens stored as bcrypt hashes
- **DTO layer** — safe API responses without leaking internal fields
- **Repository pattern** — tenant-aware data access
- **AI services** — sentiment analysis, auto-categorization, demand prediction, executive summaries
- **Complaint SLA tracking** — automatic due dates by category
- **Real-time SSE** — live notifications for menu publish, complaint updates
- **Background job queue** — async emails and notifications
- **Subscription enforcement** — user/hostel limits per plan
- **College onboarding wizard** — one-step tenant setup
- **Audit log API** — full accountability trail
- **Rate limiting** — per-endpoint limits on auth, ratings, complaints
- **S3-ready storage** — abstracted file upload layer
- **19 unit tests** passing

## Migration from v1

```bash
cd backend
npx prisma migrate dev --name production_ready
npx prisma db seed
```

**Note:** `User.refreshToken` is replaced by `User.refreshTokenHash`. All users must re-login after migration.


### Prerequisites

- Node.js 20+
- PostgreSQL (or Neon account)
- Docker (optional)

### Local Development

```bash
# Clone and install
git clone <repo-url>
cd HostelFoodComittee

# Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Docker

```bash
docker-compose up -d
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Swagger Docs: http://localhost:5000/api-docs

## Project Structure

```
├── backend/          # Express API, Prisma, services
├── frontend/         # React SPA
├── docs/             # Architecture, API, deployment guides
├── docker-compose.yml
└── README.md
```

## Default Credentials (Seed)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@cdip.io | SuperAdmin@123 |
| College Admin | admin@demo.edu | Admin@123 |
| Warden | warden@demo.edu | Warden@123 |
| Mess Operator | operator@demo.edu | Operator@123 |
| Student | student@demo.edu | Student@123 |

## Documentation

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [ER Diagram](./docs/ER-DIAGRAM.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Development Guidelines](./docs/DEVELOPMENT.md)
- [Implementation Roadmap](./docs/ROADMAP.md)

## License

MIT
