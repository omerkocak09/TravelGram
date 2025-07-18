const express = require('express');
const router = express.Router();
const { uploadImage, getImage, getUserImages, deleteImage } = require('../controllers/image.controller');
const { upload } = require('../services/upload.service');
const { authenticateUser } = require('../middleware/auth.middleware');
const multer = require('multer');

// Multer ayarları
const storage = multer.memoryStorage();
const uploadMulter = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Resim yükleme rotası
router.post('/upload', authenticateUser, uploadMulter.single('image'), uploadImage);

// Kullanıcının resimlerini listeleme
router.get('/myimages', authenticateUser, getUserImages);

// Belirli bir resmi görüntüleme
router.get('/:id', getImage);

// Resim silme
router.delete('/:id', authenticateUser, deleteImage);

// Görüntü sınıflandırma endpoint'i
router.post('/classify', uploadMulter.single('image'), uploadImage);

module.exports = router;
