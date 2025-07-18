const API_BASE_URL = 'http://localhost:3000/api';

export const analyzeImage = async (imageUrl) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      throw new Error('AI analiz hatası');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('AI servis hatası:', error);
    throw error;
  }
};

export const generateDescription = async (imageUrl) => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-description`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      throw new Error('Açıklama oluşturma hatası');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('AI servis hatası:', error);
    throw error;
  }
};

export const calculateScore = async (imageUrl) => {
  try {
    const response = await fetch(`${API_BASE_URL}/calculate-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      throw new Error('Puan hesaplama hatası');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('AI servis hatası:', error);
    throw error;
  }
};
