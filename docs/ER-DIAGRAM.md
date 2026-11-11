# CDIP Entity-Relationship Diagram

```mermaid
erDiagram
    College ||--o{ Hostel : has
    College ||--o{ User : employs
    College ||--o{ DiningHall : owns
    College ||--o{ Subscription : has
    College ||--o{ Announcement : publishes

    Hostel ||--o{ Block : contains
    Hostel ||--o{ Student : houses
    Hostel ||--o| DiningHall : linked_to
    Hostel ||--o{ MealSkip : tracks

    Block ||--o{ Floor : has
    Floor ||--o{ Room : has
    Room ||--o{ Student : assigned

    User ||--o| Student : profile
    User ||--o| Warden : profile
    User ||--o| Contractor : profile
    User ||--o{ Rating : submits
    User ||--o{ Review : writes
    User ||--o{ Complaint : files
    User ||--o{ Suggestion : proposes
    User ||--o{ Vote : casts
    User ||--o{ Notification : receives
    User ||--o{ AuditLog : generates

    DiningHall ||--o{ Menu : schedules
    Menu ||--o{ Meal : contains
    Meal ||--o{ Dish : lists
    Meal ||--o{ Rating : receives

    Poll ||--o{ PollOption : has
    PollOption ||--o{ Vote : receives

    Contractor ||--o{ DiningHall : manages

    College {
        uuid id PK
        string name
        string slug UK
        string logo
        string address
        boolean isActive
        datetime createdAt
    }

    Hostel {
        uuid id PK
        uuid collegeId FK
        string name
        string code
        int capacity
    }

    User {
        uuid id PK
        uuid collegeId FK
        string email UK
        string passwordHash
        enum role
        boolean isVerified
        boolean isActive
    }

    Menu {
        uuid id PK
        uuid diningHallId FK
        date menuDate
        enum status
    }

    Meal {
        uuid id PK
        uuid menuId FK
        enum mealType
        time startTime
        time endTime
    }

    Dish {
        uuid id PK
        uuid mealId FK
        string name
        boolean isVegetarian
        json allergens
        int calories
    }

    Rating {
        uuid id PK
        uuid mealId FK
        uuid userId FK
        int taste
        int quality
        int quantity
        int hygiene
        int variety
        int temperature
        int overall
    }

    Complaint {
        uuid id PK
        uuid collegeId FK
        uuid userId FK
        enum category
        enum status
        string description
    }

    MealSkip {
        uuid id PK
        uuid studentId FK
        date skipDate
        enum mealType
        enum reason
        enum status
    }
```

## Tenant Isolation

Every tenant-scoped entity includes `collegeId` (directly or via parent relation). Middleware enforces:

1. JWT contains `collegeId` and `role`
2. Super Admin bypasses tenant filter
3. All queries filter by `collegeId` for non-super-admin users

## Indexes

- `User(email)` — unique login lookup
- `College(slug)` — tenant routing
- `Menu(diningHallId, menuDate)` — daily menu fetch
- `Rating(mealId, userId)` — prevent duplicate ratings
- `Complaint(collegeId, status)` — dashboard queries
- `MealSkip(studentId, skipDate, mealType)` — skip validation
