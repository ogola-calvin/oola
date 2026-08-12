# Patient Management Backend (Node.js + MySQL)

Backend for the Intellisoft Patient Management assignment. Implements the
three required modules — **Patient Registration**, **Vitals**, and **Visit
Forms** (Overweight / General Assessment) — as a new set of REST endpoints,
built from scratch rather than consuming the provided Postman collection.

## Approach

> As required by the brief: **this project implements new backend endpoints**
> rather than consuming the existing Laravel API from the Postman collection.
> The route shapes (`/patients/add`, `/vitals/add`, `/visits/add`, `.../view`)
> intentionally mirror that collection's naming for familiarity, but this is
> an independent Node.js/Express/MySQL implementation with its own schema.

## Tech Stack
- **Runtime:** Node.js + Express
- **Database:** MySQL (via `mysql2`, connection pool, parameterized queries)
- **Auth:** none required by the assignment brief for the backend endpoints — can be added with `express-rate-limit` / JWT if needed later
- **Testing:** Postman (or curl — examples below)

## Setup

```bash
npm install
cp .env.example .env        # then edit DB_PASSWORD etc.
mysql -u root -p < db/schema.sql
npm start                   # or: npm run dev (nodemon)
```

Server runs at `http://localhost:8181/api` by default (`PORT` in `.env`).

## Data Model

- **patients** — registration form. `patient_id` (the business-facing ID
  typed by the user) is unique; enforced at the DB level and with a
  friendly 409 response at the API level.
- **vitals** — height/weight per visit date; BMI is **always calculated
  server-side**, never trusted from the client. One record per
  `(patient_id, visit_date)`.
- **visits** — covers *both* the Overweight and General assessment forms
  via a `form_type` column, linked to the `vitals` row that triggered it.
  Which form applies is derived server-side from that vital's BMI
  (`BMI > 25 → overweight`, `BMI ≤ 25 → general`) — the client can't force
  the wrong form.

## Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/patients/add` | Register a patient |
| GET | `/api/patients?visit_date=YYYY-MM-DD` | List patients (name, age, last BMI status), optional date filter |
| POST | `/api/vitals/add` | Record vitals, auto-calculates BMI, returns `next_form` |
| POST | `/api/vitals/view` | Vitals history for a patient |
| POST | `/api/visits/add` | Submit Overweight or General assessment (auto-detected) |
| POST | `/api/visits/view` | Visit history for a patient |

### Example: register a patient
```bash
curl -X POST http://localhost:8181/api/patients/add \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "P-001",
    "registration_date": "2025-01-10",
    "first_name": "Jane",
    "last_name": "Doe",
    "date_of_birth": "1990-05-15",
    "gender": "Female"
  }'
```

### Example: record vitals (drives the BMI branch)
```bash
curl -X POST http://localhost:8181/api/vitals/add \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "P-001",
    "visit_date": "2025-02-01",
    "height_cm": 160,
    "weight_kg": 80
  }'
# -> { "data": { "vital_id": 1, "bmi": 31.25, "next_form": "overweight" } }
```
The frontend reads `next_form` to decide which of the two assessment forms
to load next, exactly per the spec's branching rule.

### Example: submit the matching assessment form
```bash
curl -X POST http://localhost:8181/api/visits/add \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "P-001",
    "vital_id": 1,
    "visit_date": "2025-02-01",
    "general_health": "Good",
    "on_diet": "Yes",
    "comments": "Trying to eat better"
  }'
```
If `vital_id` points to a BMI ≤ 25, the API expects `on_drugs` instead of
`on_diet` and rejects the request with a 422 otherwise.

## Business rules implemented
- Patient `patient_id` is unique — duplicate registration returns `409`.
- BMI = weight(kg) / height(m)², rounded to 2 decimals, computed server-side.
- BMI status for listing: `< 18.5` Underweight, `18.5–24.9` Normal, `≥ 25` Overweight.
- Vitals/visit submissions are unique per `(patient, date[, form_type])` —
  multiple visits allowed, but not two on the same date.
- Patient listing supports filtering by visit date and returns Name, Age,
  and Last BMI Status as required.

## Project structure
```
config/db.js          MySQL connection pool
db/schema.sql          Full schema (patients, vitals, visits)
controllers/           Request handlers with validation
routes/                Express route definitions
utils/bmi.js            BMI calc, status, age, next-form logic
utils/response.js       Consistent {success, message, code, data} responses
server.js               App entry point
```
