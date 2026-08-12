/**
 * ============================================================================
 * API CONFIG — single source of truth.
 * ============================================================================
 * Only the `visits` module was fully documented in the Postman collection I
 * was given (visits/add, visits/view, with a Bearer-token header and a
 * {message, success, code, data} response envelope). The `patients` and
 * `vitals` modules were not shown, so their paths/fields below are inferred
 * by following the SAME convention as the documented `visits` endpoints:
 *   - POST <module>/add   to create
 *   - POST <module>/view  to list / fetch
 *   - snake_case field names, string patient_id
 *
 * If your real collection differs, this is the ONLY file that should need
 * to change — every view imports endpoint paths and field names from here
 * rather than hardcoding them.
 * ============================================================================
 */

export const API_BASE_URL =
  window.localStorage.getItem('api_base_url') || 'http://localhost:8181/api';

// Set a token here (or call setAuthToken from the console / a login screen)
// if your backend's Sanctum auth requires it for these routes.
export const AUTH_TOKEN_STORAGE_KEY = 'auth_token';

export const ENDPOINTS = {
  patients: {
    add: 'patients/add',
    // NOTE: matches the reference Node/MySQL backend, which exposes
    // GET /api/patients?visit_date=YYYY-MM-DD (not a POST .../view route
    // like the visits module). If you swap in the real Laravel API from
    // the Postman collection and it uses a different convention, change
    // this back to a POST path and flip listing.js to use apiPost.
    list: 'patients',
  },
  vitals: {
    add: 'vitals/add',
    view: 'vitals/view', // assumed: POST, { patient_id }
  },
  visits: {
    // Confirmed from the provided Postman doc
    add: 'visits/add',
    view: 'visits/view',
  },
};

// Field name mapping — change here if the real API uses different keys.
export const FIELDS = {
  patient: {
    patientId: 'patient_id',
    registrationDate: 'registration_date',
    firstName: 'first_name',
    lastName: 'last_name',
    dateOfBirth: 'date_of_birth',
    gender: 'gender',
  },
  vital: {
    patientId: 'patient_id',
    visitDate: 'visit_date',
    height: 'height_cm',
    weight: 'weight_kg',
    bmi: 'bmi',
  },
  visit: {
    // Exactly as shown in the provided Postman doc
    generalHealth: 'general_health',
    onDiet: 'on_diet',
    onDrugs: 'on_drugs',
    comments: 'comments',
    visitDate: 'visit_date',
    patientId: 'patient_id',
    vitalId: 'vital_id',
  },
};
