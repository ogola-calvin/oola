import { apiPost } from '../api.js';
import { ENDPOINTS, FIELDS } from '../config.js';
import { getPatient, getVital, clearFlow, setPatient, setVital } from '../state.js';
import { navigate } from '../app.js';
import { alertHtml } from '../ui.js';
import { nextFormFor, statusClass, bmiStatus, todayIso } from '../utils.js';

export function renderAssessmentView(mount) {
  const patient = getPatient();
  const vital = getVital();
  const formType = nextFormFor(Number(vital.bmi)); // 'overweight' | 'general'
  const status = bmiStatus(Number(vital.bmi));

  const isOverweight = formType === 'overweight';

  mount.innerHTML = `
    <div class="card-header">
      <span class="card-eyebrow">Step 3 · Patient ${patient.patient_id}</span>
      <h1>${isOverweight ? 'Overweight Assessment Form' : 'General Assessment Form'}</h1>
      <p>
        Shown automatically because BMI is
        <strong>${vital.bmi}</strong>
        <span class="pill ${statusClass(status)}">${status}</span>
        ${isOverweight ? '(&gt; 25 → Overweight Assessment)' : '(&le; 25 → General Assessment)'}
      </p>
    </div>
    <div id="assessment-alert"></div>
    <form id="assessment-form">
      <div class="form-grid">
        <div>
          <label for="visit_date">Visit date</label>
          <input type="date" id="visit_date" name="visit_date" value="${vital.visit_date || todayIso()}" required />
        </div>
        <div>
          <label>General health</label>
          <div class="radio-row">
            <label><input type="radio" name="general_health" value="Good" required /> Good</label>
            <label><input type="radio" name="general_health" value="Poor" /> Poor</label>
          </div>
        </div>

        ${
          isOverweight
            ? `<div class="span-2">
                <label>Have you ever been on a diet to lose weight?</label>
                <div class="radio-row">
                  <label><input type="radio" name="on_diet" value="Yes" required /> Yes</label>
                  <label><input type="radio" name="on_diet" value="No" /> No</label>
                </div>
              </div>`
            : `<div class="span-2">
                <label>Are you currently using any drugs?</label>
                <div class="radio-row">
                  <label><input type="radio" name="on_drugs" value="Yes" required /> Yes</label>
                  <label><input type="radio" name="on_drugs" value="No" /> No</label>
                </div>
              </div>`
        }

        <div class="span-2">
          <label for="comments">Comments</label>
          <textarea id="comments" name="comments" required></textarea>
        </div>
      </div>
      <div class="actions">
        <button type="submit" class="btn-primary" id="assessment-submit">Save &amp; view patient list</button>
      </div>
    </form>
  `;

  document.getElementById('assessment-form').addEventListener('submit', (e) =>
    onSubmit(e, { patient, vital, formType })
  );
}

async function onSubmit(e, { patient, vital, formType }) {
  e.preventDefault();
  const form = e.target;
  const alertMount = document.getElementById('assessment-alert');
  const submitBtn = document.getElementById('assessment-submit');
  alertMount.innerHTML = '';

  const payload = {
    [FIELDS.visit.patientId]: patient.patient_id,
    [FIELDS.visit.vitalId]: vital.vital_id,
    [FIELDS.visit.visitDate]: form.visit_date.value,
    [FIELDS.visit.generalHealth]: form.general_health.value,
    [FIELDS.visit.comments]: form.comments.value.trim(),
  };
  if (formType === 'overweight') {
    payload[FIELDS.visit.onDiet] = form.on_diet.value;
  } else {
    payload[FIELDS.visit.onDrugs] = form.on_drugs.value;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving…';

  try {
    await apiPost(ENDPOINTS.visits.add, payload);
    // Keep the patient's identity for the listing page's context, but the
    // wizard for this encounter is complete — a fresh vitals visit would
    // start a new cycle, so clear the vital pointer.
    const completedPatient = patient;
    clearFlow();
    setPatient(completedPatient);
    setVital(null);
    navigate('listing'); // "Upon saving the form, load the patient listing page"
  } catch (err) {
    alertMount.innerHTML = alertHtml(err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save & view patient list';
  }
}
