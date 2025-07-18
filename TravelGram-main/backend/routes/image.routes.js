const express = require('express');
const router = express.Router();
const multer = require('multer');
const imageController = require('../controllers/image.controller');

// Multer ayarları
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Görüntü sınıflandırma endpoint'i
router.post('/classify', upload.single('image'), imageController.classifyImage);

module.exports = router; 