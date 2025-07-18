const { getGridFS } = require('../services/upload.service');
const Image = require('../models/Image');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const imageClassifierService = require('../services/imageClassifier.service');

// Resim yükleme işlemi
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Hiçbir dosya yüklenmedi' });
    }

    // Kullanıcı bilgilerini al
    const { uid } = req.user;
    
    // Yüklenen dosya hakkında meta verileri kaydet
    const newImage = new Image({
      filename: req.file.filename,
      originalName: req.file.originalname,
      contentType: req.file.contentType || req.file.mimetype,
      size: req.file.size,
      userId: uid,
      description: req.body.description || '',
      location: req.body.location || ''
    });

    await newImage.save();

    res.status(201).json({
      success: true,
      imageId: newImage._id,
      filename: req.file.filename,
      message: 'Resim başarıyla yüklendi'
    });
  } catch (error) {
    console.error('Resim yükleme hatası:', error);
    res.status(500).json({ error: 'Resim yüklenirken bir hata oluştu' });
  }
};

// Resim görüntüleme işlemi
const getImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Resim meta verilerini bul
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ error: 'Resim bulunamadı' });
    }

    // GridFS'den dosyayı al
    const gfs = getGridFS();
    const file = await gfs.find({ filename: image.filename }).toArray();
    
    if (!file || file.length === 0) {
      return res.status(404).json({ error: 'Dosya bulunamadı' });
    }

    // Resim dosyasını stream olarak gönder
    const readStream = gfs.openDownloadStreamByName(image.filename);
    res.set('Content-Type', image.contentType);
    readStream.pipe(res);
  } catch (error) {
    console.error('Resim görüntüleme hatası:', error);
    res.status(500).json({ error: 'Resim görüntülenirken bir hata oluştu' });
  }
};

// Kullanıcının tüm resimlerini listele
const getUserImages = async (req, res) => {
  try {
    const { uid } = req.user;
    const images = await Image.find({ userId: uid }).sort({ uploadDate: -1 });
    
    res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    console.error('Kullanıcı resimleri listeleme hatası:', error);
    res.status(500).json({ error: 'Resimler listelenirken bir hata oluştu' });
  }
};

// Resim silme işlemi
const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.user;
    
    // Resim meta verilerini bul
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ error: 'Resim bulunamadı' });
    }
    
    // Sadece resmin sahibi silebilir
    if (image.userId !== uid) {
      return res.status(403).json({ error: 'Bu resmi silme yetkiniz yok' });
    }

    // GridFS'den dosyayı sil
    const gfs = getGridFS();
    const file = await gfs.find({ filename: image.filename }).toArray();
    
    if (file && file.length > 0) {
      await gfs.delete(new ObjectId(file[0]._id));
    }
    
    // Meta verileri sil
    await Image.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Resim başarıyla silindi'
    });
  } catch (error) {
    console.error('Resim silme hatası:', error);
    res.status(500).json({ error: 'Resim silinirken bir hata oluştu' });
  }
};

const classifyImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Lütfen bir görüntü yükleyin' });
        }

        // Yüklenen görüntüyü sınıflandır
        const result = await imageClassifierService.classifyImage(req.file.buffer);

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
  uploadImage,
  getImage,
  getUserImages,
  deleteImage,
  classifyImage
};
