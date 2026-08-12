const pool = require('../config/db');
const { success, fail } = require('../utils/response');
const { calculateBmi, nextFormType } = require('../utils/bmi');

/**
 * POST /api/vitals/add
 * Body: { patient_id (the business patient_id, e.g. "P-001"), visit_date, height_cm, weight_kg }
 *
 * BMI is calculated server-side (never trust a client-supplied BMI).
 * Response includes `next_form` so the frontend knows whether to load
 * the Overweight Assessment Form or the General Assessment Form next,
 * per the spec's branching rule.
 */
async function addVital(req, res) {
  const { patient_id, visit_date, height_cm, weight_kg } = req.body;

  const missing = [];
  if (!patient_id) missing.push('patient_id');
  if (!visit_date) missing.push('visit_date');
  if (height_cm === undefined) missing.push('height_cm');
  if (weight_kg === undefined) missing.push('weight_kg');
  if (missing.length) {
    return fail(res, 'Missing required fields', 422, { missing });
  }

  const height = Number(height_cm);
  const weight = Number(weight_kg);
  if (!(height > 0) || !(weight > 0)) {
    return fail(res, 'height_cm and weight_kg must be positive numbers', 422);
  }

  try {
    const [patients] = await pool.query('SELECT id FROM patients WHERE patient_id = ?', [patient_id]);
    if (!patients.length) {
      return fail(res, 'Patient not found', 404);
    }
    const patientPk = patients[0].id;

    const bmi = calculateBmi(height, weight);

    const [result] = await pool.query(
      `INSERT INTO vitals (patient_id, visit_date, height_cm, weight_kg, bmi)
       VALUES (?, ?, ?, ?, ?)`,
      [patientPk, visit_date, height, weight, bmi]
    );

    return success(
      res,
      {
        vital_id: result.insertId,
        bmi,
        next_form: nextFormType(bmi), // "overweight" or "general"
      },
      'Vitals Added Successfully'
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return fail(res, 'Vitals for this patient on this date already exist', 409);
    }
    console.error(err);
    return fail(res, 'Failed to save vitals', 500);
  }
}

/**
 * POST /api/vitals/view
 * Body: { patient_id }  -> vitals history for a patient, most recent first.
 */
async function listVitals(req, res) {
  const { patient_id } = req.body;
  if (!patient_id) return fail(res, 'patient_id is required', 422);

  try {
    const [patients] = await pool.query('SELECT id FROM patients WHERE patient_id = ?', [patient_id]);
    if (!patients.length) return fail(res, 'Patient not found', 404);

    const [rows] = await pool.query(
      `SELECT id AS vital_id, visit_date, height_cm, weight_kg, bmi
       FROM vitals WHERE patient_id = ? ORDER BY visit_date DESC`,
      [patients[0].id]
    );

    return success(res, rows, 'success');
  } catch (err) {
    console.error(err);
    return fail(res, 'Failed to fetch vitals', 500);
  }
}

module.exports = { addVital, listVitals };
