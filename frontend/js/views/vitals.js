import { apiPost } from '../api.js';
import { ENDPOINTS, FIELDS } from '../config.js';
import { getPatient, setVital } from '../state.js';
import { navigate } from '../app.js';
import { alertHtml } from '../ui.js';
import { calculateBmi, bmiStatus, statusClass, todayIso } from '../utils.js';

export function renderVitalsView(mount) {
  const patient = getPatient();

  mount.innerHTML = `
    <div class="card-header">
      <span class="card-eyebrow">Step 2 · Patient ${patient.patient_id}</span>
      <h1>Record vitals</h1>
      <p>BMI is calculated automatically as you enter height and weight.</p>
    </div>
    <div id="vitals-alert"></div>
    <form id="vitals-form">
      <div class="form-grid">
        <div>
          <label for="visit_date">Visit date</label>
          <input type="date" id="visit_date" name="visit_date" value="${todayIso()}" required />
        </div>
        <div></div>
        <div>
          <label for="height">Height (cm)</label>
          <input type="number" id="height" name="height" step="0.1" min="1" required />
        </div>
        <div>
          <label for="weight">Weight (kg)</label>
          <input type="number" id="weight" name="weight" step="0.1" min="1" required />
        </div>
        <div class="span-2">
          <label>BMI (auto-calculated)</label>
          <div class="readout" id="bmi-readout">
            <div class="r-item">
              <span class="r-label">BMI</span>
              <span class="r-value" id="bmi-value">—</span>
            </div>
            <div class="r-item">
              <span class="r-label">Status</span>
              <span class="r-value" id="bmi-status">—</span>
            </div>
            <div class="r-item">
              <span class="r-label">Next form</span>
              <span class="r-value" id="bmi-next">—</span>
            </div>
          </div>
        </div>
      </div>
      <div class="actions">
        <button type="submit" class="btn-primary" id="vitals-submit">Save &amp; continue</button>
      </div>
    </form>
  `;

  const heightInput = document.getElementById('height');
  const weightInput = document.getElementById('weight');
  const updateReadout = () => {
    const bmi = calculateBmi(heightInput.value, weightInput.value);
    document.getElementById('bmi-value').textContent = bmi ?? '—';
    const status = bmi !== null ? bmiStatus(bmi) : null;
    const statusEl = document.getElementById('bmi-status');
    statusEl.innerHTML = status ? `<span class="pill ${statusClass(status)}">${status}</span>` : '—';
    document.getElementById('bmi-next').textContent =
      bmi !== null ? (bmi > 25 ? 'Overweight Assessment' : 'General Assessment') : '—';
  };
  heightInput.addEventListener('input', updateReadout);
  weightInput.addEventListener('input', updateReadout);

  document.getElementById('vitals-form').addEventListener('submit', (e) => onSubmit(e, patient));
}

async function onSubmit(e, patient) {
  e.preventDefault();
  const form = e.target;
  const alertMount = document.getElementById('vitals-alert');
  const submitBtn = document.getElementById('vitals-submit');
  alertMount.innerHTML = '';

  const height = Number(form.height.value);
  const weight = Number(form.weight.value);
  const localBmi = calculateBmi(height, weight);

  const payload = {
    [FIELDS.vital.patientId]: patient.patient_id,
    [FIELDS.vital.visitDate]: form.visit_date.value,
    [FIELDS.vital.height]: height,
    [FIELDS.vital.weight]: weight,
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving…';

  try {
    const data = await apiPost(ENDPOINTS.vitals.add, payload);
    // Prefer the backend's calculated BMI/vital_id; fall back to the
    // client-side calc if the response doesn't include them.
    const vitalId = data?.vital_id ?? data?.id ?? null;
    const bmi = data?.bmi !== undefined ? Number(data.bmi) : localBmi;

    setVital({
      vital_id: vitalId,
      bmi,
      height,
      weight,
      visit_date: form.visit_date.value,
    });

    navigate('assessment'); // BMI decides which form renders next
  } catch (err) {
    alertMount.innerHTML = alertHtml(err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save & continue';
  }
}
