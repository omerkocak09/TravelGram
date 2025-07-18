const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const tf = require('@tensorflow/tfjs-node');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class AIService {
  constructor() {
    this.model = null;
  }

  async loadModel() {
    try {
      if (!this.model) {
        const modelPath = path.join(__dirname, '../../finall_model.h5');
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

  async generateImageCaption(imageUrl) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
      const result = await model.generateContent([imageUrl]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating image caption:', error);
      throw error;
    }
  }

  async analyzeAudioTranscript(transcript) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = `Please analyze this travel story and rate it on a scale of 1-10 based on its informativeness, engagement, and storytelling quality: "${transcript}"`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      // Extract the numerical score from the response
      const score = parseInt(response.text().match(/\d+/)[0]) || 5;
      return score;
    } catch (error) {
      console.error('Error analyzing audio transcript:', error);
      throw error;
    }
  }

  async generateTravelRecommendations(userInterests, visitedLocations) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = `Based on the user's interests: ${userInterests.join(', ')} and previously visited locations: ${visitedLocations.join(', ')}, suggest 3 new travel destinations with brief descriptions.`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating travel recommendations:', error);
      throw error;
    }
  }
}

module.exports = new AIService();
