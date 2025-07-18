const imageClassificationService = require('../services/imageClassification.service');

const classifyImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Lütfen bir görüntü yükleyin' });
        }

        // Yüklenen görüntüyü sınıflandır
        const result = await imageClassificationService.classifyImage(req.file.buffer);

        res.json({
            success: true,
            classification: result
        });
    } catch (error) {
        console.error('Görüntü sınıflandırma hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Görüntü sınıflandırma sırasında bir hata oluştu'
        });
    }
};

module.exports = {
    classifyImage
}; 