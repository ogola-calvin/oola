/**
 * Simple in-memory state carried through the registration -> vitals ->
 * assessment -> listing flow. Persisted to sessionStorage so a page
 * refresh mid-flow doesn't lose the current patient context.
 */
const STORAGE_KEY = 'pma_flow_state';

function load() {
  try {
    return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

const state = load();

function persist() {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function setPatient(patient) {
  state.patient = patient; // { patient_id, first_name, last_name, date_of_birth, gender }
  persist();
}

export function getPatient() {
  return state.patient || null;
}

export function setVital(vital) {
  state.vital = vital; // { vital_id, bmi, next_form, height, weight, visit_date }
  persist();
}

export function getVital() {
  return state.vital || null;
}

export function clearFlow() {
  state.patient = null;
  state.vital = null;
  persist();
}
