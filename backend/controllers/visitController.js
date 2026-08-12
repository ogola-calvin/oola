const pool = require('../config/db');
const { success, fail } = require('../utils/response');
const { nextFormType } = require('../utils/bmi');

/**
 * POST /api/visits/add
 * Body (matches the original Postman doc, plus vital_id):
 * {
 *   "patient_id": "1",        // business patient_id
 *   "vital_id": "1",          // vitals.id this assessment is attached to
 *   "visit_date": "2025-10-31",
 *   "general_health": "Good", // "Good" | "Poor"       -> both forms
 *   "on_diet": "Yes",         // "Yes" | "No"           -> Overweight form only
 *   "on_drugs": "Yes",        // "Yes" | "No"           -> General form only
 *   "comments": "Test Comment"
 * }
 *
 * form_type is derived from the linked vital's BMI (server-side, so the
 * client can't force the wrong form): BMI > 25 -> overweight, else general.
 * That also tells us whether to expect on_diet or on_drugs.
 */
async function addVisit(req, res) {
  const { patient_id, vital_id, visit_date, general_health, on_diet, on_drugs, comments } = req.body;

  const missing = [];
  if (!patient_id) missing.push('patient_id');
  if (!vital_id) missing.push('vital_id');
  if (!visit_date) missing.push('visit_date');
  if (!general_health) missing.push('general_health');
  if (missing.length) {
    return fail(res, 'Missing required fields', 422, { missing });
  }
  if (!['Good', 'Poor'].includes(general_health)) {
    return fail(res, 'general_health must be "Good" or "Poor"', 422);
  }

  try {
    const [patients] = await pool.query('SELECT id FROM patients WHERE patient_id = ?', [patient_id]);
    if (!patients.length) return fail(res, 'Patient not found', 404);
    const patientPk = patients[0].id;

    const [vitalsRows] = await pool.query(
      'SELECT id, bmi FROM vitals WHERE id = ? AND patient_id = ?',
      [vital_id, patientPk]
    );
    if (!vitalsRows.length) {
      return fail(res, 'Vitals record not found for this patient', 404);
    }

    const formType = nextFormType(Number(vitalsRows[0].bmi)); // 'overweight' | 'general'

    if (formType === 'overweight') {
      if (!on_diet || !['Yes', 'No'].includes(on_diet)) {
        return fail(res, 'on_diet ("Yes"/"No") is required for the Overweight Assessment Form', 422);
      }
    } else {
      if (!on_drugs || !['Yes', 'No'].includes(on_drugs)) {
        return fail(res, 'on_drugs ("Yes"/"No") is required for the General Assessment Form', 422);
      }
    }

    const [result] = await pool.query(
      `INSERT INTO visits
         (patient_id, vital_id, visit_date, form_type, general_health, on_diet, on_drugs, comments)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patientPk,
        vital_id,
        visit_date,
        formType,
        general_health,
        formType === 'overweight' ? on_diet : null,
        formType === 'general' ? on_drugs : null,
        comments || null,
      ]
    );

    return success(
      res,
      { visit_id: result.insertId, form_type: formType },
      'Visit Added Successfully'
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return fail(res, 'A visit of this type already exists for this patient on this date', 409);
    }
    console.error(err);
    return fail(res, 'Failed to save visit', 500);
  }
}

/**
 * POST /api/visits/view
 * Body: { patient_id, visit_date? } -> visit history, optionally filtered by date.
 */
async function listVisits(req, res) {
  const { patient_id, visit_date } = req.body;
  if (!patient_id) return fail(res, 'patient_id is required', 422);

  try {
    const [patients] = await pool.query('SELECT id FROM patients WHERE patient_id = ?', [patient_id]);
    if (!patients.length) return fail(res, 'Patient not found', 404);

    const params = [patients[0].id];
    let sql = `SELECT id AS visit_id, vital_id, visit_date, form_type, general_health,
                      on_diet, on_drugs, comments
               FROM visits WHERE patient_id = ?`;
    if (visit_date) {
      sql += ' AND visit_date = ?';
      params.push(visit_date);
    }
    sql += ' ORDER BY visit_date DESC';

    const [rows] = await pool.query(sql, params);
    return success(res, rows, 'success');
  } catch (err) {
    console.error(err);
    return fail(res, 'Failed to fetch visits', 500);
  }
}

module.exports = { addVisit, listVisits };
