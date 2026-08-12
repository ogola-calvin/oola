import { renderChartStrip, renderStepper, renderApiLabel, openApiConfigModal } from './ui.js';
import { getPatient, getVital } from './state.js';
import { renderRegisterView } from './views/register.js';
import { renderVitalsView } from './views/vitals.js';
import { renderAssessmentView } from './views/assessment.js';
import { renderListingView } from './views/listing.js';

const mount = document.getElementById('view-mount');

const ROUTES = {
  register: { render: renderRegisterView, stepKey: 'register' },
  vitals: { render: renderVitalsView, stepKey: 'vitals' },
  assessment: { render: renderAssessmentView, stepKey: 'assessment' },
  listing: { render: renderListingView, stepKey: 'listing' },
};

export function navigate(route) {
  window.location.hash = `#/${route}`;
}

function guardedRoute(name) {
  // Vitals needs a patient in context; assessment needs a vital in context.
  if (name === 'vitals' && !getPatient()) return 'register';
  if (name === 'assessment' && !getVital()) return getPatient() ? 'vitals' : 'register';
  return name;
}

function currentRouteName() {
  const hash = window.location.hash.replace('#/', '');
  return ROUTES[hash] ? hash : 'register';
}

function render() {
  const requested = currentRouteName();
  const name = guardedRoute(requested);
  if (name !== requested) {
    window.location.hash = `#/${name}`;
    return; // hashchange will re-trigger render()
  }

  renderChartStrip();
  renderStepper(ROUTES[name].stepKey);
  mount.innerHTML = '';
  ROUTES[name].render(mount);
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', () => {
  renderApiLabel();
  document.getElementById('api-config-btn').addEventListener('click', openApiConfigModal);
  if (!window.location.hash) window.location.hash = '#/register';
  render();
});
