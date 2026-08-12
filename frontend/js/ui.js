import { getPatient, getVital } from './state.js';
import { calculateAge, statusClass, bmiStatus } from './utils.js';
import { API_BASE_URL } from './config.js';

const STEPS = [
  { key: 'register', label: 'Register patient' },
  { key: 'vitals', label: 'Record vitals' },
  { key: 'assessment', label: 'Assessment form' },
  { key: 'listing', label: 'Patient listing' },
];

export function renderChartStrip() {
  const mount = document.getElementById('chart-strip-mount');
  const patient = getPatient();
  const vital = getVital();

  if (!patient) {
    mount.innerHTML = `
      <div class="chart-strip is-empty">
        <span>No patient in context yet — register a patient to begin a chart.</span>
      </div>`;
    return;
  }

  const age = calculateAge(patient.date_of_birth);
  const bmi = vital ? vital.bmi : null;
  const status = bmi !== null && bmi !== undefined ? bmiStatus(Number(bmi)) : null;

  mount.innerHTML = `
    <div class="chart-strip">
      <div class="cs-item">
        <span class="cs-label">Patient ID</span>
        <span class="cs-value">${escapeHtml(patient.patient_id)}</span>
      </div>
      <div class="cs-item">
        <span class="cs-label">Name</span>
        <span class="cs-value">${escapeHtml(patient.first_name)} ${escapeHtml(patient.last_name)}</span>
      </div>
      <div class="cs-item">
        <span class="cs-label">Age</span>
        <span class="cs-value">${Number.isFinite(age) ? age : '—'}</span>
      </div>
      <div class="cs-spacer"></div>
      ${
        status
          ? `<div class="cs-item">
              <span class="cs-label">BMI</span>
              <span class="cs-value">${bmi} <span class="pill ${statusClass(status)}">${status}</span></span>
            </div>`
          : ''
      }
    </div>`;
}

export function renderStepper(activeKey) {
  const el = document.getElementById('stepper');
  const patient = getPatient();
  const vital = getVital();

  const doneMap = {
    register: !!patient,
    vitals: !!vital,
    assessment: false, // set true once a visit form has been submitted (handled by caller via localStorage flag if desired)
    listing: false,
  };

  el.innerHTML = STEPS.map((s, i) => {
    const isActive = s.key === activeKey;
    const isDone = doneMap[s.key] && !isActive;
    const cls = isActive ? 'active' : isDone ? 'done' : '';
    return `<li class="${cls}"><span class="num">${isDone ? '✓' : i + 1}</span>${s.label}</li>`;
  }).join('');
}

export function renderApiLabel() {
  document.getElementById('api-url-label').textContent = API_BASE_URL.replace(/^https?:\/\//, '');
}

export function openApiConfigModal() {
  const mount = document.getElementById('modal-mount');
  mount.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal">
        <h3>API base URL</h3>
        <p>Point the app at your backend (e.g. <code>http://localhost:8181/api</code> or the production URL).</p>
        <input type="text" id="api-url-input" value="${API_BASE_URL}" />
        <div class="actions">
          <button class="btn-secondary" id="modal-cancel" type="button">Cancel</button>
          <button class="btn-primary" id="modal-save" type="button">Save &amp; reload</button>
        </div>
      </div>
    </div>`;

  document.getElementById('modal-cancel').onclick = () => (mount.innerHTML = '');
  document.getElementById('modal-backdrop').onclick = (e) => {
    if (e.target.id === 'modal-backdrop') mount.innerHTML = '';
  };
  document.getElementById('modal-save').onclick = () => {
    const val = document.getElementById('api-url-input').value.trim();
    if (val) {
      window.localStorage.setItem('api_base_url', val.replace(/\/$/, ''));
      window.location.reload();
    }
  };
}

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function alertHtml(message, type = 'error') {
  return `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
}
