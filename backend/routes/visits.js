const express = require('express');
const router = express.Router();
const { addVisit, listVisits } = require('../controllers/visitController');

router.post('/add', addVisit);
router.post('/view', listVisits);

module.exports = router;
