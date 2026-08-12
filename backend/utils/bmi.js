/**
 * Calculate BMI from height (cm) and weight (kg).
 * BMI = weight(kg) / height(m)^2
 */
function calculateBmi(heightCm, weightKg) {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 100) / 100; // 2 decimal places
}

/**
 * Spec:
 *  - Underweight: BMI < 18.5
 *  - Normal:      18.5 <= BMI < 25
 *  - Overweight:  BMI >= 25
 */
function bmiStatus(bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  return 'Overweight';
}

/**
 * Which visit form should be triggered next.
 * Spec: BMI <= 25 -> General Assessment Form, BMI > 25 -> Overweight Assessment Form.
 * Note this uses <= 25 (matches the "Vitals" saving rule), which is a
 * one-point overlap with bmiStatus's < 25 "Normal" cutoff by design of the spec.
 */
function nextFormType(bmi) {
  return bmi > 25 ? 'overweight' : 'general';
}

function calculateAge(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

module.exports = { calculateBmi, bmiStatus, nextFormType, calculateAge };
