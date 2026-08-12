# Patient Management — Frontend

A 5-page web app implementing the Intellisoft assignment flow: **Patient
Registration → Vitals → (Overweight or General) Assessment → Patient
Listing**, consuming the REST API documented in the provided Postman
collection.

## ⚠️ Important: API assumptions

The Postman doc I was given fully documented only the **`visits`** module
(`visits/add`, `visits/view`, Bearer-token auth, and a
`{message, success, code, data}` response envelope). The `patients` and
`vitals` modules were referenced (e.g. `visits/add` takes a `patient_id`
and `vital_id`) but their own endpoints/fields were not shown.

This frontend was built by **extending the same convention** used by the
documented `visits` endpoints:
- `POST patients/add`, `POST patients/view`
- `POST vitals/add`, `POST vitals/view`
- snake_case fields, string `patient_id`

**Every endpoint path and field name lives in one file:**
[`js/config.js`](js/config.js). If your actual Postman collection uses
different paths or field names for `patients`/`vitals`, that's the only
file you should need to edit — no view/component code references raw
strings.

The listing page (`js/views/listing.js`) also tolerates two possible
response shapes from `patients/view` (a pre-computed `{name, age,
last_bmi_status}` row, or a raw patient record it can compute those from
itself), so it should degrade gracefully either way.

## Running it

No build step — just serve the folder statically (ES modules require
`http://`, not `file://`):

```bash
cd patient-frontend
npx serve .
# or: python3 -m http.server 5173
```

Then open the printed URL. On first load it points at
`http://localhost:8181/api` — click the **API** pill top-right to change
it to your Laravel backend's URL (e.g.
`https://patientvisitapis.intellisoftkenya.com/api`). It's stored in
`localStorage` so it persists across reloads.

If your backend's Sanctum auth requires a bearer token for these routes,
set one from the browser console:
```js
import('./js/api.js').then(m => m.setAuthToken('YOUR_TOKEN'))
```
(or wire up a login screen — not required by the assignment brief, so
it's left as a manual step here.)

## Pages & flow

| # | Page | File | Notes |
|---|---|---|---|
| 1 | Patient Registration | `js/views/register.js` | Unique `patient_id` enforced by the backend; on success, auto-navigates to Vitals |
| 2 | Vitals | `js/views/vitals.js` | Height/weight in, BMI computed **live in the UI** as you type (and again authoritatively from whatever the backend returns) |
| 3/4 | Overweight / General Assessment | `js/views/assessment.js` | One file, two renders — the BMI on the just-saved vital decides which form (and which field, `on_diet` vs `on_drugs`) is shown, exactly per the spec's branch rule (`BMI > 25` → Overweight, `BMI ≤ 25` → General) |
| 5 | Patient Listing | `js/views/listing.js` | Name / Age / Last BMI status table with a visit-date filter |

State (current patient, current vital/BMI) is kept in `sessionStorage` via
`js/state.js` so the wizard survives an accidental page refresh, and the
persistent "chart strip" header at the top of every page shows who's
currently in context.

## Project structure
```
index.html              Shell + view-mount container
css/style.css            Design tokens & all styling
js/config.js              ⚠️ API paths & field names — edit here first
js/api.js                  fetch wrapper (auth header, error handling)
js/state.js                 sessionStorage-backed flow state
js/utils.js                 BMI / age / status calculations
js/ui.js                     Chart strip, stepper, API-config modal
js/app.js                     Hash router across the 5 views
js/views/register.js          Page 1
js/views/vitals.js             Page 2
js/views/assessment.js          Pages 3 & 4
js/views/listing.js              Page 5
```

## Design notes

Palette and type were chosen for a clinical-chart feel rather than a
generic dashboard: numeric vitals render in a monospace "readout" style
(like a monitor display), and a persistent mono-styled "chart strip"
carries patient ID / name / age / BMI status across every page like a
wristband tab. The left-hand numbered stepper is a genuine sequence
(Register → Vitals → Assessment → Listing), which is why it's numbered
rather than decorative.
