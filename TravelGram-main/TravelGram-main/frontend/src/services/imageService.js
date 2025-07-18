import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { getAuth } from 'firebase/auth';
import { app } from '../firebaseConfig';

const API_URL = 'http://localhost:5000/api/images';

// AuthContext erişimini sağlayan yardımcı fonksiyon
let authContextInstance = null;

// AuthContext'e erişim için yardımcı fonksiyon - Component dışında kullanılabilir
export const getAuthUser = () => {
  console.log('getAuthUser çağrıldı, authContextInstance:', authContextInstance ? 'VAR' : 'YOK');
  
  // Kullanıcı nesnesini saklamak için değişken
  let user = null;
  
  try {
    // 1. Yöntem: AuthContext kullanıcı bilgisini kontrol et
    if (authContextInstance) {
      console.log('AuthContext içinden user kontrol ediliyor...');
      if (authContextInstance.user) {
        console.log('AuthContext.user bulundu:', authContextInstance.user.uid);
        user = authContextInstance.user;
        return user; // Hemen döndür
      }
      
      // 2. Yöntem: AuthContext.getCurrentUser() metodunu kullan
      if (authContextInstance.getCurrentUser && typeof authContextInstance.getCurrentUser === 'function') {
        console.log('AuthContext.getCurrentUser() çağrılıyor...');
        const contextUser = authContextInstance.getCurrentUser();
        if (contextUser) {
          console.log('getCurrentUser() ile kullanıcı bulundu:', contextUser.uid);
          user = contextUser;
          return user; // Hemen döndür
        }
      }
    }
    
    // 3. Yöntem: Firebase'den direkt getAuth() ile eriş
    try {
      console.log('Firebase getAuth(app) ile direkt erişim deneyi...');
      const directAuth = getAuth(app);
      if (directAuth && directAuth.currentUser) {
        console.log('Direkt Firebase auth ile kullanıcı bulundu:', directAuth.currentUser.uid);
        user = directAuth.currentUser;
        return user; // Hemen döndür
      }
    } catch (authError) {
      console.error('Firebase auth (app) hatası:', authError);
    }
    
    // 4. Yöntem: Firebase'den app parametresi olmadan direkt getAuth()
    try {
      console.log('Firebase getAuth() ile direkt erişim deneyi...');
      const altAuth = getAuth();
      if (altAuth && altAuth.currentUser) {
        console.log('Alternatif Firebase auth ile kullanıcı bulundu:', altAuth.currentUser.uid);
        user = altAuth.currentUser;
        return user; // Hemen döndür
      }
    } catch (authError) {
      console.error('Firebase auth hatası:', authError);
    }
    
    // Eğer buraya kadar geldiysek kullanıcı bulunamadı
    console.log('Hiçbir yöntemle kullanıcı bulunamadı!');
    return null;
  } catch (error) {
    console.error('getAuthUser genel hata:', error);
    return null;
  }
};

// Context'i dışarıdan ayarlamak için fonksiyon
export const setAuthContextInstance = (instance) => {
  authContextInstance = instance;
  console.log('Auth context instance ayarlandı:', instance ? 'başarılı' : 'başarısız');
  if (instance) {
    // İnstance varsa basit kontrol yapalım
    console.log('setAuthContextInstance kontrol - user:', instance.user ? 'VAR' : 'YOK');
    if (instance.user) {
      console.log('Kullanıcı bilgileri:', instance.user.uid, instance.user.email);
    }
  }
};

/**
 * Resim yükleme servisi - Firebase Storage yerine MongoDB Atlas'a resim yükler
 */
export const uploadImageToMongoDB = async (imageFile, description = '', location = '') => {
  try {
    console.log('uploadImageToMongoDB başladı, imageFile:', imageFile ? 'var' : 'yok');
    
    // Çok katmanlı kullanıcı doğrulama sistemi
    console.log('Çok katmanlı kullanıcı doğrulama başlıyor...');
    
    // Kullanıcı değişkeni
    let user = null;
    
    // 1. Katman: AuthContext'ten user özelliği
    if (authContextInstance && authContextInstance.user) {
      console.log('1. KATMAN: AuthContext.user kontrol ediliyor...');
      user = authContextInstance.user;
      console.log('AuthContext.user bulundu:', user.uid);
    }
    
    // 2. Katman: AuthContext'ten getCurrentUser() metodu
    if (!user && authContextInstance && authContextInstance.getCurrentUser && typeof authContextInstance.getCurrentUser === 'function') {
      console.log('2. KATMAN: AuthContext.getCurrentUser() çağrılıyor...');
      user = authContextInstance.getCurrentUser();
      console.log('getCurrentUser() sonucu:', user ? `Kullanıcı bulundu: ${user.uid}` : 'Kullanıcı bulunamadı');
    }
    
    // 3. Katman: Direkt Firebase auth
    if (!user) {
      console.log('3. KATMAN: Direkt Firebase auth kontrolü...');
      const directAuth = getAuth(app);
      if (directAuth && directAuth.currentUser) {
        user = directAuth.currentUser;
        console.log('Firebase auth ile kullanıcı bulundu:', user.uid);
      }
    }
    
    // 4. Katman: Alternatif Firebase auth çağrısı
    if (!user) {
      console.log('4. KATMAN: Alternatif Firebase auth çağrısı yapılıyor...');
      try {
        const altAuth = getAuth();
        if (altAuth && altAuth.currentUser) {
          user = altAuth.currentUser;
          console.log('Alternatif Firebase auth ile kullanıcı bulundu:', user.uid);
        }
      } catch (authError) {
        console.log('Alternatif auth hatası:', authError.message);
      }
    }
    
    // Kullanıcı hala bulunamadıysa hata fırlat
    if (!user) {
      console.error('HATA: Kullanıcı oturumu bulunamadı!');
      throw new Error('Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.');
    }

    // Token al
    const token = await user.getIdToken();

    // Form verisi oluştur
    const formData = new FormData();
    formData.append('image', {
      uri: imageFile,
      name: 'image.jpg',
      type: 'image/jpeg'
    });
    
    if (description) formData.append('description', description);
    if (location) formData.append('location', location);

    // API'ye istek gönder
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Resim yüklenirken bir hata oluştu');
    }

    const data = await response.json();
    console.log('Resim başarıyla yüklendi:', data);
    
    // MongoDB'ye yüklenen resmin URL'sini oluştur
    return `${API_URL}/${data.imageId}`;
  } catch (error) {
    console.error('Resim yükleme hatası:', error.message);
    // Hata yönetimini daha net yapmak için
    if (error.message.includes('MongoDB') || error.message.includes('bağlanılamıyor')) {
      throw new Error('Sunucu bağlantı hatası: MongoDB sunucusu kapalı olabilir');
    } else if (error.message.includes('Oturum')) {
      throw new Error('Oturum açmanız gerekiyor. Lütfen tekrar giriş yapın.');
    } else {
      throw error;
    }
  }
};

/**
 * Kullanıcının resimlerini getir
 */
export const getUserImages = async () => {
  try {
    // Güçlendirilmiş kullanıcı kontrolü
    const user = getAuthUser();
    console.log('Güçlendirilmiş kullanıcı kontrolü (getUserImages):', user ? 'Var' : 'Yok');

    if (!user) {
      console.error('Kullanıcı oturumu bulunamadı:', null);
      throw new Error('Oturum açmanız gerekiyor');
    }

    const token = await user.getIdToken();
    
    const response = await fetch(`${API_URL}/myimages`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Resimler alınırken bir hata oluştu');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Resimleri getirme hatası:', error);
    throw error;
  }
};

/**
 * Resmi sil
 */
export const deleteImage = async (imageId) => {
  try {
    // Güçlendirilmiş kullanıcı kontrolü
    const user = getAuthUser();
    console.log('Güçlendirilmiş kullanıcı kontrolü (deleteImage):', user ? 'Var' : 'Yok');

    if (!user) {
      console.error('Kullanıcı oturumu bulunamadı:', null);
      throw new Error('Oturum açmanız gerekiyor');
    }

    const token = await user.getIdToken();
    
    const response = await fetch(`${API_URL}/${imageId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Resim silinirken bir hata oluştu');
    }

    return true;
  } catch (error) {
    console.error('Resim silme hatası:', error);
    throw error;
  }
};
