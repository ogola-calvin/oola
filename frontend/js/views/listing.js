import { apiGet } from '../api.js';
import { ENDPOINTS } from '../config.js';
import { navigate } from '../app.js';
import { alertHtml, escapeHtml } from '../ui.js';
import { calculateAge, bmiStatus, statusClass } from '../utils.js';

export function renderListingView(mount) {
  mount.innerHTML = `
    <div class="card-header">
      <span class="card-eyebrow">Step 4</span>
      <h1>Patient listing</h1>
      <p>Name, age, and BMI status from each patient's most recent vitals visit.</p>
    </div>
    <div class="table-toolbar">
      <div class="field">
        <label for="filter_date">Filter by visit date</label>
        <input type="date" id="filter_date" />
      </div>
      <button class="btn-secondary" id="filter-apply" type="button">Apply filter</button>
      <button class="btn-secondary" id="filter-clear" type="button">Clear</button>
      <div style="flex:1"></div>
      <button class="btn-primary" id="register-another" type="button">+ Register another patient</button>
    </div>
    <div id="listing-alert"></div>
    <table>
      <thead>
        <tr>
          <th>Patient name</th>
          <th>Age</th>
          <th>Last BMI status</th>
          <th>Last visit</th>
        </tr>
      </thead>
      <tbody id="listing-body">
        <tr class="skeleton-row"><td colspan="4">Loading patients…</td></tr>
      </tbody>
    </table>
  `;

  document.getElementById('register-another').addEventListener('click', () => navigate('register'));
  document.getElementById('filter-apply').addEventListener('click', () => load(document.getElementById('filter_date').value));
  document.getElementById('filter-clear').addEventListener('click', () => {
    document.getElementById('filter_date').value = '';
    load();
  });

  load();
}

async function load(visitDate) {
  const body = document.getElementById('listing-body');
  const alertMount = document.getElementById('listing-alert');
  alertMount.innerHTML = '';
  body.innerHTML = `<tr class="skeleton-row"><td colspan="4">Loading patients…</td></tr>`;

  try {
    // Node backend: GET /api/patients?visit_date=YYYY-MM-DD
    const rows = await apiGet(ENDPOINTS.patients.list, visitDate ? { visit_date: visitDate } : {});
    renderRows(Array.isArray(rows) ? rows : []);
  } catch (err) {
    body.innerHTML = '';
    alertMount.innerHTML = alertHtml(err.message);
  }
}

function renderRows(rows) {
  const body = document.getElementById('listing-body');

  if (!rows.length) {
    body.innerHTML = `
      <tr><td colspan="4">
        <div class="empty-state">
          <span class="num">No patients found</span>
        </div>
      </td></tr>`;
    return;
  }

  body.innerHTML = rows
    .map((r) => {
      // Tolerate either a pre-computed shape (name/age/last_bmi_status, as
      // this project's own reference backend returns) or a raw patient
      // record (first_name/last_name/date_of_birth + separate bmi).
      const name = r.name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || '—';
      const age = r.age ?? (r.date_of_birth ? calculateAge(r.date_of_birth) : '—');
      const bmiValue = r.last_bmi ?? r.bmi ?? null;
      const status = r.last_bmi_status || (bmiValue !== null ? bmiStatus(Number(bmiValue)) : 'No vitals recorded');
      const visitDate = r.last_visit_date || r.visit_date || '—';

      const pillClass = status === 'No vitals recorded' ? '' : statusClass(status);

      return `
        <tr>
          <td>${escapeHtml(name)}</td>
          <td>${escapeHtml(age)}</td>
          <td>${pillClass ? `<span class="pill ${pillClass}">${escapeHtml(status)}</span>` : escapeHtml(status)}</td>
          <td>${escapeHtml(visitDate)}</td>
        </tr>`;
    })
    .join('');
}
