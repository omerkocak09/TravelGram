import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  auth, 
  db, 
  app,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from '../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { ref, set, get, update } from 'firebase/database';
import { Platform } from 'react-native';

const AuthContext = createContext({
  user: null,
  loading: true,
  register: async () => {},
  login: async () => {},
  logout: async () => {},
  updateUserProfile: async () => {}
});

// Firebase hata mesajlarını Türkçeleştir
const getFirebaseErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'Bu e-posta adresi zaten kullanımda';
    case 'auth/invalid-email':
      return 'Geçersiz e-posta adresi';
    case 'auth/operation-not-allowed':
      return 'E-posta/şifre girişi etkin değil';
    case 'auth/weak-password':
      return 'Şifre çok zayıf';
    case 'auth/user-disabled':
      return 'Bu kullanıcı hesabı devre dışı bırakılmış';
    case 'auth/user-not-found':
      return 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı';
    case 'auth/wrong-password':
      return 'Hatalı şifre';
    case 'auth/too-many-requests':
      return 'Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin';
    default:
      return 'Bir hata oluştu. Lütfen tekrar deneyin';
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Global değişken oluştur - tüm bileşenlerin erişebileceği
  if (typeof global.travelgramUser === 'undefined') {
    global.travelgramUser = null;
    console.log('Global travelgramUser değişkeni oluşturuldu');
  }
  
  // Güçlendirilmiş kimlik doğrulama yönetimi
  useEffect(() => {
    console.log('AuthContext başlatılıyor...');
    
    // İki farklı auth nesnesini de kontrol et
    const directAuth = getAuth(app);
    
    console.log('Auth nesneleri kontrol ediliyor:', {
      importedAuth: auth ? 'var' : 'yok',
      directAuth: directAuth ? 'var' : 'yok',
      currentUserImported: auth?.currentUser ? 'var' : 'yok',
      currentUserDirect: directAuth?.currentUser ? 'var' : 'yok'
    });
    
    // Kullanıcı değişikliğini yönet - daha güçlü bir şekilde
    const handleUserUpdate = (updatedUser) => {
      if (updatedUser) {
        console.log('Kullanıcı bilgisi güncellendi:', {
          uid: updatedUser.uid,
          email: updatedUser.email,
          displayName: updatedUser.displayName || 'belirlenmemiş'
        });
        
        // Kullanıcı bilgisini global değişkene kaydet ve state'i güncelle
        try {
          // Kullanıcı nesnesini global değişken olarak kaydet
          global.travelgramUser = updatedUser;
          console.log('Global travelgramUser güncellendi:', updatedUser.uid);
          
          // Lokal state'i güncelle
          setUser(updatedUser);
        } catch (error) {
          console.error('Kullanıcı bilgisi güncellenirken hata:', error);
        }
        
        setLoading(false);
      } else if (!auth.currentUser && !directAuth.currentUser) {
        try {
          // Global değişkeni temizle
          if (global.travelgramUser) {
            global.travelgramUser = null;
            console.log('Global travelgramUser temizlendi');
          }
          
          // Lokal state'i temizle
          setUser(null);
        } catch (error) {
          console.error('Kullanıcı çıkışı işlenirken hata:', error);
        }
        
        // Sadece her iki auth nesnesi de null ise user null olarak ayarla
        console.log('Kullanıcı oturumu sonlandı');
        setLoading(false);
      }
    };
    
    // İki farklı auth nesnesini dinle ve birleştir
    const unsubscribeImported = onAuthStateChanged(auth, (importedUser) => {
      console.log('Ana auth değişikliği:', importedUser ? 'Giriş yapıldı' : 'Çıkış yapıldı');
      handleUserUpdate(importedUser);
    });
    
    const unsubscribeDirect = onAuthStateChanged(directAuth, (directUser) => {
      console.log('Direkt auth değişikliği:', directUser ? 'Giriş yapıldı' : 'Çıkış yapıldı');
      handleUserUpdate(directUser);
    });
    
    // İlk kontrol - eğer zaten giriş yapılmışsa hemen güncelle
    if (auth.currentUser) {
      console.log('Mevcut auth.currentUser bulundu');
      handleUserUpdate(auth.currentUser);
    } else if (directAuth.currentUser) {
      console.log('Mevcut directAuth.currentUser bulundu');
      handleUserUpdate(directAuth.currentUser);
    }
    
    // Dinleyicileri temizle
    return () => {
      unsubscribeImported();
      unsubscribeDirect();
      console.log('Auth dinleyicileri temizlendi');
    };
  }, []);

  const register = async (username, email, password) => {
    console.log('TAMAMEN YENİ REGISTER FONKSİYONU ÇAĞRILDI');
    
    // Temel değişkenler
    let user = null;

    try {
      // Giriş verilerini kontrol et
      if (!username?.trim()) throw new Error('Kullanıcı adı gerekli');
      if (!email?.trim()) throw new Error('E-posta adresi gerekli');
      if (!password?.trim()) throw new Error('Şifre gerekli');
      if (password.length < 6) throw new Error('Şifre en az 6 karakter olmalı');
      
      // E-posta formatını kontrol et
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error('Geçerli bir e-posta adresi girin');
      }

      // Değişkenleri temizle
      const trimmedUsername = username.trim();
      const trimmedEmail = email.trim();
      
      // Doğrudan Firebase modüllerini import et
      const { getAuth, createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
      const { getDatabase, ref, set } = require('firebase/database');
      
      console.log('Firebase modülleri yüklendi');
      
      // 1. Firebase Auth servisini al
      const auth = getAuth();
      if (!auth) throw new Error('Firebase Auth servisi başlatılamadı');
      
      console.log('Kullanıcı kaydı başlatılıyor...');
      
      // 2. Kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      
      if (!userCredential?.user) {
        throw new Error('Kullanıcı oluşturulamadı');
      }
      
      user = userCredential.user;
      console.log('Kullanıcı oluşturuldu:', user.uid);
      
      // 3. Kullanıcı profilini güncelle
      await updateProfile(user, {
        displayName: trimmedUsername
      });
      console.log('Kullanıcı profili güncellendi');
      
      // 4. Veritabanı kaydı oluştur
      const db = getDatabase();
      const userRef = ref(db, `users/${user.uid}`);
      
      const userData = {
        username: trimmedUsername,
        email: trimmedEmail,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        uid: user.uid,
        photoURL: '',
        bio: '',
        followers: {},
        following: {}
      };
      
      await set(userRef, userData);
      console.log('Kullanıcı veritabanına kaydedildi');
      
      // Auth state güncelle
      setUser(user);
      
      console.log('Kayıt tamamen başarılı:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });
      
      return user;
      
    } catch (error) {
      console.error('KAYIT HATASI:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // Eğer kullanıcı oluşturulmuşsa ama bir hata olduysa, kullanıcıyı sil
      if (user) {
        try {
          await user.delete();
          console.log('Hata nedeniyle kullanıcı silindi');
        } catch (deleteError) {
          console.error('Kullanıcı silinirken hata:', deleteError.message);
        }
      }
      
      // Firebase hata kodlarını insancıl mesajlara çevir
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Bu e-posta adresi zaten kullanımda');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Geçersiz e-posta formatı');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Şifre çok zayıf. En az 6 karakter kullanın');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('E-posta/şifre ile kayıt şu anda mümkün değil');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('İnternet bağlantınızı kontrol edin');
      }
      
      // Diğer hatalar için
      throw new Error('Kayıt işlemi başarısız oldu: ' + error.message);
    }
  };

  // Güçlendirilmiş login fonksiyonu
  const login = async (email, password) => {
    console.log('LOGIN FONKSİYONU ÇAĞRILDI');
    
    // Giriş parametrelerini kontrol et
    if (!email?.trim() || !password) {
      throw new Error('E-posta ve şifre gereklidir');
    }
    
    try {
      console.log('Giriş deneniyor:', {
        emailProvided: email ? 'var' : 'yok',
        passwordLength: password?.length || 0
      });

      // İki farklı auth nesnesini de kullan
      const directAuth = getAuth(app);
      console.log('Auth nesneleri:', {
        importedAuth: auth ? 'var' : 'yok',
        directAuth: directAuth ? 'var' : 'yok'
      });
      
      // Hangisi daha güvenilirse onu kullan
      const activeAuth = directAuth || auth;
      
      // 1. Oturum açma işlemini gerçekleştir
      let userCredential;
      try {
        console.log('Firebase signin işlemi başlatılıyor...');
        userCredential = await signInWithEmailAndPassword(activeAuth, email.trim(), password);
        console.log('Firebase signin başarılı!');
      } catch (authError) {
        console.error('Firebase auth HATA:', authError.code, authError.message);
        
        // Firebase hata kodlarını işle
        switch(authError.code) {
          case 'auth/user-not-found':
            throw new Error('Kullanıcı bulunamadı');
          case 'auth/wrong-password':
            throw new Error('Yanlış şifre');
          case 'auth/invalid-email':
            throw new Error('Geçersiz e-posta formatı');
          case 'auth/user-disabled':
            throw new Error('Hesap devre dışı');
          case 'auth/too-many-requests':
            throw new Error('Çok fazla deneme yaptınız. Lütfen bekleyin');
          case 'auth/network-request-failed':
            throw new Error('İnternet bağlantınızı kontrol edin');
          default:
            throw new Error('Giriş başarısız: ' + (authError.message || 'Bilinmeyen hata'));
        }
      }
      
      // Kullanıcı credential kontrolü
      if (!userCredential?.user) {
        console.error('Kullanıcı credential objesi bulunamadı');
        throw new Error('Giriş başarısız: Kullanıcı bilgisi alınamadı');
      }
      
      const user = userCredential.user;
      console.log('Kullanıcı oturumu açıldı, veritabanı kontrol ediliyor:', user.uid);
      
      // 2. Kullanıcı veritabanı varlığını kontrol et
      try {
        console.log('Veritabanı sorgusu yapılıyor:', `users/${user.uid}`);
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        
        if (!snapshot.exists()) {
          console.error('Kullanıcı veritabanında bulunamadı, veri oluşturuluyor');
          
          // Kullanıcı verisini oluştur, minimum gerekli bilgi
          const userData = {
            email: user.email,
            username: user.displayName || email.split('@')[0],
            createdAt: new Date().toISOString(),
            uid: user.uid
          };
          
          await set(userRef, userData);
          console.log('Yeni kullanıcı verisi oluşturuldu');
        } else {
          console.log('Kullanıcı verisi mevcut');
        }
      } catch (dbError) {
        console.error('Veritabanı kontrolü HATA:', dbError);
        // Veritabanı hatası giriş işlemini engellemeyecek
        console.log('Veritabanı hatasına rağmen girişe devam ediliyor');
      }
      
      console.log('GİRİŞ BAŞARILI:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });
      
      // Kullanıcı state'ini ve global değişkeni güncelle
      setUser(user);
      
      // Global değişkeni de güncelle
      global.travelgramUser = user;
      console.log('Login: Global travelgramUser güncellendi:', user.uid);
      
      // Başarıyla giriş yapan kullanıcıyı döndür
      return user;
      
    } catch (error) {
      console.error('LOGIN GENEL HATASI:', {
        name: error.name,
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // Hata zaten işlemden geçmişse direkt fırlat
      throw error;
    }
  };

  const logout = async () => {
    try {
      // İki auth nesnesinden de çıkış yapmayı dene
      const directAuth = getAuth(app);
      
      console.log('Çıkış yapılıyor...');
      
      try {
        await signOut(auth);
        console.log('Ana auth çıkışı başarılı');
      } catch (error1) {
        console.error('Ana auth çıkış hatası:', error1);
      }
      
      try {
        await signOut(directAuth);
        console.log('Direkt auth çıkışı başarılı');
      } catch (error2) {
        console.error('Direkt auth çıkış hatası:', error2);
      }
      
      // Kullanıcı state'ini ve global değişkeni sıfırla
      setUser(null);
      global.travelgramUser = null;
      console.log('Çıkış başarılı, global travelgramUser temizlendi');
      
    } catch (error) {
      console.error('Çıkış genel hatası:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates) => {
    if (!user) {
      throw new Error('Oturum açık değil');
    }

    try {
      // Firebase Authentication profilini güncelle
      if (updates.displayName || updates.photoURL) {
        await updateProfile(user, {
          displayName: updates.displayName,
          photoURL: updates.photoURL
        });
      }

      // Realtime Database'i güncelle
      const userRef = ref(db, `users/${user.uid}`);
      await update(userRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      console.log('Profil güncellendi');
      return user;
      
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      throw new Error('Profil güncellenemedi');
    }
  };

  // Güçlendirilmiş getCurrentUser metodu
  const getCurrentUser = () => {
    // İki farklı yöntemle kullanıcı bilgisine erişmeyi dene
    const directAuth = getAuth(app);
    
    // Önce context'teki user state'i kontrol et
    if (user) {
      return user;
    }
    
    // Sonra auth.currentUser'a bak
    if (auth.currentUser) {
      return auth.currentUser;
    }
    
    // Son olarak directAuth.currentUser'a bak
    if (directAuth.currentUser) {
      return directAuth.currentUser;
    }
    
    // Kullanıcı bulunamadı
    return null;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      register, 
      login, 
      logout, 
      updateUserProfile,
      getCurrentUser, // Yeni güçlendirilmiş metodu ekliyoruz
      isAuthenticated: !!user // Kolayca kontrol için yardımcı değişken
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
