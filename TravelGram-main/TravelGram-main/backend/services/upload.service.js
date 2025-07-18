const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

// MongoDB bağlantı URI'sini al
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('MONGODB_URI çevre değişkeni tanımlanmamış!');
  process.exit(1);
}

// GridFS depolama oluştur
const storage = new GridFsStorage({
  url: mongoUri,
  options: { },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      // Benzersiz bir dosya adı oluştur
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads' // GridFS koleksiyon adı
        };
        resolve(fileInfo);
      });
    });
  }
});

// Multer middleware'i oluştur
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    // Sadece görüntü dosyaları kabul et
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir!'));
    }
  }
});

// GridFS için bağlantı ve bucket oluştur
let gfs;
mongoose.connection.once('open', () => {
  gfs = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
  console.log('GridFS bağlantısı hazır');
});

module.exports = { 
  upload,
  getGridFS: () => gfs 
};
