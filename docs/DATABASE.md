# CDIP Database Schema

PostgreSQL database managed via Prisma ORM.

## Entity Count: 25 models

### Platform Layer
- **College** — Tenant root entity
- **Subscription** — SaaS plan management

### Structure Layer
- **Hostel** → **Block** → **Floor** → **Room**
- **DiningHall** — Linked to hostel/contractor
- **MealTiming** — Per dining hall meal schedules

### User Layer
- **User** — Central auth entity with role enum
- **Student** — Extended profile with roll number, hostel
- **Warden** — Hostel manager profile
- **Contractor** — Mess operator company profile

### Dining Layer
- **Menu** — Daily menu per dining hall
- **Meal** — Breakfast/Lunch/Snacks/Dinner
- **Dish** — Individual food items with nutrition

### Feedback Layer
- **Rating** — 7-criteria star ratings (unique per user/meal)
- **Review** — Text reviews with optional anonymity
- **Complaint** — Categorized issues with status workflow
- **Suggestion** — Student proposals with upvotes
- **MealSkip** — Skip requests with approval workflow
- **Attendance** — Meal attendance tracking

### Engagement Layer
- **Poll** → **PollOption** → **Vote**
- **Announcement** — Management broadcasts
- **Notification** — In-app notifications

### System Layer
- **Report** — Generated report records
- **AuditLog** — Action audit trail

## Key Constraints

```sql
-- Prevent duplicate ratings
UNIQUE(mealId, userId) ON Rating

-- One menu per hall per day
UNIQUE(diningHallId, menuDate) ON Menu

-- One vote per poll per user
UNIQUE(pollId, userId) ON Vote

-- One skip per student/date/meal
UNIQUE(studentId, skipDate, mealType) ON MealSkip
```

## Tenant Isolation

Every query for non-Super-Admin users filters by `collegeId`:
- Direct: Complaint, Poll, Suggestion, Announcement
- Via relation: Rating → Meal → Menu → DiningHall → College

## Migrations

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

## Prisma Studio

```bash
npx prisma studio
```
