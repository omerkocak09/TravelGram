const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// Auth middleware'i daha sonra eklenecek
router.post('/', userController.createUser);
router.get('/:userId', userController.getUser);
router.put('/:userId', userController.updateUser);
router.post('/:userId/follow', userController.followUser);

module.exports = router;
