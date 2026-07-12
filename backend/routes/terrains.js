const express = require('express');
const router = express.Router();
const { getTerrains, getTerrainById, getCities, getAvailableSlots } = require('../controllers/terrainController');

router.get('/', getTerrains);
router.get('/cities', getCities);
router.get('/:id', getTerrainById);
router.get('/:id/slots', getAvailableSlots);

module.exports = router;
