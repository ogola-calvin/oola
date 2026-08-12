export function calculateBmi(heightCm, weightKg) {
  const h = Number(heightCm) / 100;
  const w = Number(weightKg);
  if (!h || !w) return null;
  return Math.round((w / (h * h)) * 100) / 100;
}

/** Underweight < 18.5, Normal 18.5–24.9, Overweight >= 25 (per spec) */
export function bmiStatus(bmi) {
  if (bmi === null || bmi === undefined) return null;
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  return 'Overweight';
}

/** BMI <= 25 -> General Assessment Form, BMI > 25 -> Overweight Assessment Form (per spec) */
export function nextFormFor(bmi) {
  return bmi > 25 ? 'overweight' : 'general';
}

export function calculateAge(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function statusClass(status) {
  if (status === 'Overweight' || status === 'Poor') return 'pill-warn';
  if (status === 'Underweight') return 'pill-info';
  return 'pill-good';
}
