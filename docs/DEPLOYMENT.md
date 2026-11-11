# CDIP Deployment Guide

## Prerequisites

- Node.js 20+
- PostgreSQL (Neon recommended for production)
- Docker & Docker Compose (optional)

## Environment Variables

### Backend (.env)

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/cdip?sslmode=require
JWT_SECRET=<min-32-char-secret>
JWT_REFRESH_SECRET=<min-32-char-secret>
FRONTEND_URL=https://your-domain.com
SMTP_HOST=smtp.provider.com
SMTP_USER=your-email
SMTP_PASS=your-password
```

### Frontend (.env)

```env
VITE_API_URL=https://api.your-domain.com/api/v1
```

## Neon PostgreSQL Setup

1. Create account at [neon.tech](https://neon.tech)
2. Create a new project and database
3. Copy the connection string to `DATABASE_URL`
4. Run migrations:

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

## Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Run migrations in container
docker-compose exec backend npx prisma migrate deploy
```

## Manual Deployment

### Backend

```bash
cd backend
npm ci
npx prisma generate
npm run build
NODE_ENV=production node dist/server.js
```

Use PM2 for process management:
```bash
pm2 start dist/server.js --name cdip-api
```

### Frontend

```bash
cd frontend
npm ci
npm run build
# Serve dist/ with Nginx, Vercel, or Netlify
```

## Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    root /var/www/cdip/dist;
    try_files $uri $uri/ /index.html;
}
```

## Health Check

```bash
curl http://localhost:5000/health
# { "status": "ok", "timestamp": "..." }
```

## Security Checklist

- [ ] Change JWT secrets in production
- [ ] Enable SSL/TLS
- [ ] Configure CORS with exact frontend URL
- [ ] Set up database backups on Neon
- [ ] Configure rate limiting appropriately
- [ ] Never commit .env files
