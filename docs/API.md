# CDIP REST API Documentation

Base URL: `http://localhost:5000/api/v1`

Swagger UI: `http://localhost:5000/api-docs`

## Authentication

All protected endpoints require `Authorization: Bearer <access_token>` header.

### POST /auth/login
```json
// Request
{ "email": "student@demo.edu", "password": "Student@123" }

// Response
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "email": "...", "role": "STUDENT", ... },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### POST /auth/register
### POST /auth/refresh
### POST /auth/logout
### POST /auth/forgot-password
### POST /auth/reset-password
### GET /auth/verify-email?token=
### GET /auth/me

---

## Colleges (Super Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /colleges | Create college |
| GET | /colleges | List colleges |
| GET | /colleges/:id | Get college |
| PATCH | /colleges/:id | Update college |

---

## Hostels

| Method | Endpoint | Roles |
|--------|----------|-------|
| POST | /hostels | Super Admin, College Admin |
| GET | /hostels | All authenticated |
| GET | /hostels/:id | All authenticated |

---

## Students

| Method | Endpoint | Roles |
|--------|----------|-------|
| POST | /students | College Admin, Warden |
| GET | /students | College Admin, Warden |

---

## Dining Halls

| Method | Endpoint | Roles |
|--------|----------|-------|
| POST | /dining-halls | College Admin |
| GET | /dining-halls | All authenticated |

---

## Menus

| Method | Endpoint | Roles |
|--------|----------|-------|
| POST | /menus | Admin, Warden, Operator |
| GET | /menus?diningHallId=&date= | All |
| POST | /menus/:id/publish | Warden, Operator |
| POST | /meals/:mealId/dishes | Warden, Operator |

---

## Ratings & Reviews

| Method | Endpoint | Roles |
|--------|----------|-------|
| POST | /ratings | Student |
| GET | /ratings/meal/:mealId | All |
| POST | /reviews | Student |

### Rating Request Body
```json
{
  "mealId": "uuid",
  "taste": 4,
  "quality": 5,
  "quantity": 3,
  "hygiene": 5,
  "variety": 4,
  "temperature": 4,
  "overall": 4
}
```

---

## Complaints

| Method | Endpoint | Roles |
|--------|----------|-------|
| POST | /complaints | All |
| GET | /complaints | All (college-scoped) |
| PATCH | /complaints/:id | Warden, College Admin |

---

## Meal Skips

| Method | Endpoint | Roles |
|--------|----------|-------|
| POST | /meal-skips | Student |
| PATCH | /meal-skips/:id | Warden |

---

## Polls

| Method | Endpoint | Roles |
|--------|----------|-------|
| POST | /polls | Admin, Warden |
| GET | /polls | All |
| POST | /polls/:id/vote | Student |

---

## Suggestions

| Method | Endpoint | Roles |
|--------|----------|-------|
| POST | /suggestions | Student |
| GET | /suggestions | All |
| POST | /suggestions/:id/upvote | Student |

---

## Announcements

| Method | Endpoint | Roles |
|--------|----------|-------|
| POST | /announcements | Admin, Warden |
| GET | /announcements | All |

---

## Analytics

| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | /analytics/dashboard | All (role-specific data) |
| GET | /analytics/contractor/:id | Admin, Warden |

---

## Search

| Method | Endpoint |
|--------|----------|
| GET | /search?q=&type=all |

Types: `all`, `students`, `complaints`, `hostels`, `suggestions`, `polls`

---

## Reports

| Method | Endpoint | Roles |
|--------|----------|-------|
| POST | /reports/generate | Admin, Warden |

```json
{ "type": "WEEKLY", "format": "CSV" }
```

---

## Error Responses

```json
{
  "success": false,
  "message": "Error description"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict |
| 500 | Server error |
