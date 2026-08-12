const express = require('express');
const router = express.Router();
const { addPatient, listPatients } = require('../controllers/patientController');

router.post('/add', addPatient);
router.get('/', listPatients); // supports ?visit_date=YYYY-MM-DD

module.exports = router;
