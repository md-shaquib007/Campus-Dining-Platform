# Development Guidelines

## Architecture Principles

### Clean Architecture Layers

```
Routes → Controllers → Services → Repositories (Prisma)
                ↓
            Validators (Zod)
                ↓
              DTOs
```

- **Routes**: HTTP routing only, no business logic
- **Controllers**: Request/response handling, call services
- **Services**: Business logic, orchestration
- **Validators**: Input validation with Zod schemas
- **Never expose Prisma models directly** in API responses when sensitive

### SOLID Principles

- **Single Responsibility**: Each service handles one domain
- **Open/Closed**: AI service interface allows extension without modification
- **Dependency Inversion**: Services depend on abstractions (Prisma client injected)

## Code Style

### TypeScript
- Strict mode enabled
- No `any` types in production code
- Use interfaces for API contracts

### Naming Conventions
- Files: `kebab-case` or `camelCase.service.ts`
- Classes: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Database: `PascalCase` models, `camelCase` fields

### Git Workflow
```bash
feature/menu-calendar-view
fix/complaint-status-update
chore/update-dependencies
```

## Multi-Tenant Rules

1. Always include `collegeId` filter in queries
2. Super Admin bypasses tenant filter explicitly
3. Never trust client-provided `collegeId` — use JWT value
4. Test cross-tenant access attempts

## Adding a New Module

1. Add Prisma model + migration
2. Create Zod validator in `validators/`
3. Create service in `services/`
4. Create controller in `controllers/`
5. Add routes in `routes/index.ts`
6. Add frontend API function in `api/`
7. Create page component
8. Add route and nav item
9. Write tests

## Testing

```bash
# Backend
cd backend && npm test

# Run specific test
npx vitest run tests/validators.test.ts
```

## AI Integration (Future)

The `AIService` class in `analytics/analytics.service.ts` provides placeholder interfaces:

```typescript
AIService.analyzeSentiment(text)
AIService.predictDemand(collegeId, mealType, date)
AIService.predictWaste(collegeId, date)
```

Replace implementations with actual ML service calls when ready.

## Common Commands

```bash
# Reset database
npx prisma migrate reset

# Generate Prisma client after schema change
npx prisma generate

# View database
npx prisma studio
```
