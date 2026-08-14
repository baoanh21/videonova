const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');
const creditCtrl = require('../controllers/creditController');
const { verifyToken } = require('../middleware/auth');

router.post('/auth/register', userCtrl.register);
router.post('/auth/login', userCtrl.login);

// Update user
router.put('/users/:id', userCtrl.updateProfile);

router.post('/credit/deduct', verifyToken, creditCtrl.deductCredit);
router.post('/credit/add', verifyToken, creditCtrl.addCredit);
router.get('/transactions', verifyToken, creditCtrl.getTransactions);

module.exports = router;