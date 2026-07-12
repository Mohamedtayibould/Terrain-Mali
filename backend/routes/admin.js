const express = require('express');
const router = express.Router();
const {
  createTerrain, updateTerrain, deleteTerrain, getMyTerrains,
  addPhoto, deletePhoto,
  getMyReservations, getMyPayments, getMyStats
} = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate, requireAdmin);

router.get('/stats', getMyStats);

router.get('/terrains', getMyTerrains);
router.post('/terrains', createTerrain);
router.put('/terrains/:id', updateTerrain);
router.delete('/terrains/:id', deleteTerrain);

router.post('/photos', addPhoto);
router.delete('/photos/:id', deletePhoto);

router.get('/reservations', getMyReservations);
router.get('/payments', getMyPayments);

module.exports = router;
