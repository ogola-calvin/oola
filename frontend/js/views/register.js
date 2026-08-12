import { apiPost } from '../api.js';
import { ENDPOINTS, FIELDS } from '../config.js';
import { setPatient, clearFlow } from '../state.js';
import { navigate } from '../app.js';
import { alertHtml } from '../ui.js';
import { todayIso } from '../utils.js';

export function renderRegisterView(mount) {
  mount.innerHTML = `
    <div class="card-header">
      <span class="card-eyebrow">Step 1</span>
      <h1>Register a patient</h1>
      <p>A Patient ID must be unique and cannot be reused for another patient.</p>
    </div>
    <div id="register-alert"></div>
    <form id="register-form">
      <div class="form-grid">
        <div>
          <label for="patient_id">Patient ID</label>
          <input type="text" id="patient_id" name="patient_id" placeholder="e.g. P-1042" required />
        </div>
        <div>
          <label for="registration_date">Registration date</label>
          <input type="date" id="registration_date" name="registration_date" value="${todayIso()}" required />
        </div>
        <div>
          <label for="first_name">First name</label>
          <input type="text" id="first_name" name="first_name" required />
        </div>
        <div>
          <label for="last_name">Last name</label>
          <input type="text" id="last_name" name="last_name" required />
        </div>
        <div>
          <label for="date_of_birth">Date of birth</label>
          <input type="date" id="date_of_birth" name="date_of_birth" required />
        </div>
        <div>
          <label for="gender">Gender</label>
          <select id="gender" name="gender" required>
            <option value="" disabled selected>Select…</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
      <div class="actions">
        <button type="submit" class="btn-primary" id="register-submit">Save &amp; continue to vitals</button>
      </div>
    </form>
  `;

  document.getElementById('register-form').addEventListener('submit', onSubmit);
}

async function onSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const alertMount = document.getElementById('register-alert');
  const submitBtn = document.getElementById('register-submit');
  alertMount.innerHTML = '';

  const payload = {
    [FIELDS.patient.patientId]: form.patient_id.value.trim(),
    [FIELDS.patient.registrationDate]: form.registration_date.value,
    [FIELDS.patient.firstName]: form.first_name.value.trim(),
    [FIELDS.patient.lastName]: form.last_name.value.trim(),
    [FIELDS.patient.dateOfBirth]: form.date_of_birth.value,
    [FIELDS.patient.gender]: form.gender.value,
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving…';

  try {
    await apiPost(ENDPOINTS.patients.add, payload);
    // Fresh chart for this patient — clear any previous patient's vitals context.
    clearFlow();
    setPatient({
      patient_id: payload[FIELDS.patient.patientId],
      first_name: payload[FIELDS.patient.firstName],
      last_name: payload[FIELDS.patient.lastName],
      date_of_birth: payload[FIELDS.patient.dateOfBirth],
      gender: payload[FIELDS.patient.gender],
    });
    navigate('vitals'); // "Upon saving the Patient Registration details, load the Vitals page"
  } catch (err) {
    alertMount.innerHTML = alertHtml(err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save & continue to vitals';
  }
}
