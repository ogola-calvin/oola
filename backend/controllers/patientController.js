const pool = require('../config/db');
const { success, fail } = require('../utils/response');
const { calculateAge, bmiStatus } = require('../utils/bmi');

const GENDERS = ['Male', 'Female', 'Other'];

/**
 * POST /api/patients/add
 * Registers a new patient. patient_id must be unique (enforced at
 * app level with a friendly error, and at DB level as a safety net).
 */
async function addPatient(req, res) {
  const { patient_id, registration_date, first_name, last_name, date_of_birth, gender } = req.body;

  const missing = [];
  if (!patient_id) missing.push('patient_id');
  if (!registration_date) missing.push('registration_date');
  if (!first_name) missing.push('first_name');
  if (!last_name) missing.push('last_name');
  if (!date_of_birth) missing.push('date_of_birth');
  if (!gender) missing.push('gender');
  if (missing.length) {
    return fail(res, 'Missing required fields', 422, { missing });
  }
  if (!GENDERS.includes(gender)) {
    return fail(res, `gender must be one of: ${GENDERS.join(', ')}`, 422);
  }

  try {
    const [existing] = await pool.query('SELECT id FROM patients WHERE patient_id = ?', [patient_id]);
    if (existing.length) {
      return fail(res, 'A patient with this Patient ID is already registered', 409);
    }

    const [result] = await pool.query(
      `INSERT INTO patients (patient_id, registration_date, first_name, last_name, date_of_birth, gender)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [patient_id, registration_date, first_name, last_name, date_of_birth, gender]
    );

    return success(
      res,
      { id: result.insertId, patient_id, message: 'Patient registered successfully' },
      'Patient Registered Successfully'
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return fail(res, 'A patient with this Patient ID is already registered', 409);
    }
    console.error(err);
    return fail(res, 'Failed to register patient', 500);
  }
}

/**
 * GET /api/patients
 * Lists patients with Name, Age, and Last BMI Status.
 * Optional ?visit_date=YYYY-MM-DD filters to patients who had a
 * vitals visit on that date, and shows THAT visit's BMI status.
 */
async function listPatients(req, res) {
  const { visit_date } = req.query;

  try {
    let rows;

    if (visit_date) {
      // Filtered view: patients with a vitals record on the given date.
      [rows] = await pool.query(
        `SELECT p.id, p.patient_id, p.first_name, p.last_name, p.date_of_birth,
                v.bmi AS last_bmi, v.visit_date AS last_visit_date
         FROM patients p
         INNER JOIN vitals v ON v.patient_id = p.id AND v.visit_date = ?
         ORDER BY p.last_name, p.first_name`,
        [visit_date]
      );
    } else {
      // Default view: each patient with their MOST RECENT vitals record.
      [rows] = await pool.query(
        `SELECT p.id, p.patient_id, p.first_name, p.last_name, p.date_of_birth,
                v.bmi AS last_bmi, v.visit_date AS last_visit_date
         FROM patients p
         LEFT JOIN vitals v ON v.id = (
           SELECT v2.id FROM vitals v2
           WHERE v2.patient_id = p.id
           ORDER BY v2.visit_date DESC, v2.id DESC
           LIMIT 1
         )
         ORDER BY p.last_name, p.first_name`
      );
    }

    const data = rows.map((r) => ({
      patient_id: r.patient_id,
      name: `${r.first_name} ${r.last_name}`,
      age: calculateAge(r.date_of_birth),
      last_bmi: r.last_bmi !== null ? Number(r.last_bmi) : null,
      last_bmi_status: r.last_bmi !== null ? bmiStatus(Number(r.last_bmi)) : 'No vitals recorded',
      last_visit_date: r.last_visit_date || null,
    }));

    return success(res, data, 'success');
  } catch (err) {
    console.error(err);
    return fail(res, 'Failed to fetch patients', 500);
  }
}

module.exports = { addPatient, listPatients };
