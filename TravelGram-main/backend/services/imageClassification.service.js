const tf = require('@tensorflow/tfjs-node');
const path = require('path');

class ImageClassificationService {
    constructor() {
        this.model = null;
    }

    async loadModel() {
        try {
            if (!this.model) {
                const modelPath = path.join(__dirname, '../../../finall_model.h5');
                console.log('Model yolu:', modelPath);
                
                try {
                    this.model = await tf.loadLayersModel(`file://${modelPath}`);
                    console.log('Model başarıyla yüklendi');
                } catch (loadError) {
                    console.error('Model yükleme hatası:', loadError.message);
                    throw loadError;
                }
            }
            return this.model;
        } catch (error) {
            console.error('Model yüklenirken hata oluştu:', error);
            throw error;
        }
    }

    async classifyImage(imageBuffer) {
        try {
            if (!this.model) {
                await this.loadModel();
            }

            // Görüntüyü tensor'a çevirme
            const tensor = tf.node.decodeImage(imageBuffer);
            
            // Modelin beklediği boyuta yeniden boyutlandırma (örnek: 224x224)
            const resized = tf.image.resizeBilinear(tensor, [224, 224]);
            
            // Normalize etme (0-1 arasına)
            const normalized = resized.div(255.0);
            
            // Batch boyutu ekleme
            const batched = normalized.expandDims(0);
            
            // Tahmin yapma
            const predictions = await this.model.predict(batched).data();
            
            // Tensörleri temizleme
            tensor.dispose();
            resized.dispose();
            normalized.dispose();
            batched.dispose();

            // En yüksek olasılıklı sınıfı bulma
            const maxProbability = Math.max(...predictions);
            const predictedClass = predictions.indexOf(maxProbability);

            return {
                class: predictedClass,
                probability: maxProbability
            };
        } catch (error) {
            console.error('Görüntü sınıflandırma hatası:', error);
            throw error;
        }
    }
}

module.exports = new ImageClassificationService(); 