const express = require('express');
const router = express.Router();
const { addVital, listVitals } = require('../controllers/vitalController');

router.post('/add', addVital);
router.post('/view', listVitals);

module.exports = router;
