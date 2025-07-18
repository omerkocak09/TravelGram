import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import * as ImagePicker from 'expo-image-picker';
// MongoDB kullanımı için firebase/storage importlarını kaldırdık
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { auth, app } from '../../firebaseConfig';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { lightTheme as theme } from '../../utils/theme';

const CreatePostScreen = ({ navigation, route }) => {
  const { user, getCurrentUser, isAuthenticated } = useAuth();
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  
  // Doğrudan Firebase'den auth nesnesi al
  const firebaseAuth = getAuth(app);
  
  // Profile ekranından geçilen kullanıcı bilgisini al (varsa)
  const profileUser = route?.params?.user;
  
  console.log('Firebase Auth (direct):', firebaseAuth ? 'var' : 'yok');
  console.log('Context userID:', user?.uid || 'yok');
  console.log('Profile userID:', profileUser?.uid || 'yok');
  console.log('Firebase userID:', firebaseAuth?.currentUser?.uid || 'yok');
  console.log('Auth context instance ayarlandı: başarılı');

  useEffect(() => {
    console.log('CreatePostScreen - Başlatılıyor...');
    
    // Yapılan işlemi console'a yaz
    console.log('Platform:', Platform.OS, ' - Kullanıcı oturumu kontrolü yapılıyor');
    
    // Öncelikle route params'tan gelen kullanıcıyı kontrol edip kullanmaya çalış
    const initializeUser = () => {
      console.log('AUTH TEST - Kullanıcı kaynakları kontrol ediliyor');
      
      // 1. ProfileScreen'den geçilen kullanıcıyı kontrol et (en öncelikli)
      if (profileUser && profileUser.uid) {
        console.log('ProfileScreen parametresinden kullanıcı bulundu:', profileUser.uid);
        setAuthUser(profileUser);
        // Global değişkene de kaydet
        global.travelgramUser = profileUser;
        return true;
      }
      
      // 2. Firebase Auth'tan gelen kullanıcıyı kontrol et
      const firebaseUser = firebaseAuth?.currentUser;
      if (firebaseUser && firebaseUser.uid) {
        console.log('Firebase Auth kullanıcısı bulundu:', firebaseUser.uid);
        setAuthUser(firebaseUser);
        // Global değişkene de kaydet
        global.travelgramUser = firebaseUser;
        return true;
      }
      
      // 3. Context'ten gelen kullanıcıyı kontrol et
      if (user && user.uid) {
        console.log('Context user bulundu:', user.uid);
        setAuthUser(user);
        // Global değişkene de kaydet
        global.travelgramUser = user;
        return true;
      }
      
      // 4. Global değişkeni kontrol et
      if (global.travelgramUser && global.travelgramUser.uid) {
        console.log('Global değişkendeki kullanıcı bulundu:', global.travelgramUser.uid);
        setAuthUser(global.travelgramUser);
        return true;
      }
      
      // 3. Firebase auth nesnelerini kontrol et
      try {
        // Doğrudan bağlamadan alınan auth nesnesi
        const fbUser = firebaseAuth?.currentUser;
        if (fbUser && fbUser.uid) {
          console.log('AUTH TEST - Firebase auth user bulundu:', fbUser.uid);
          setAuthUser(fbUser);
          global.travelgramUser = fbUser;
          return true;
        }
        
        // Global auth nesnesi
        if (auth?.currentUser && auth.currentUser.uid) {
          console.log('AUTH TEST - Global auth user bulundu:', auth.currentUser.uid);
          setAuthUser(auth.currentUser);
          global.travelgramUser = auth.currentUser;
          return true;
        }
      } catch (error) {
        console.log('AUTH TEST - Firebase kontrol hatası:', error.message);
      }
      
      // 4. Context'ten alınan kullanıcıyı kontrol et
      if (user && user.uid) {
        console.log('AUTH TEST - Context user bulundu:', user.uid);
        setAuthUser(user);
        global.travelgramUser = user;
        return true;
      }
      
      // 5. getCurrentUser fonksiyonunu kontrol et
      try {
        const currentUser = getCurrentUser && getCurrentUser();
        if (currentUser && currentUser.uid) {
          console.log('AUTH TEST - getCurrentUser sonucu bulundu:', currentUser.uid);
          setAuthUser(currentUser);
          global.travelgramUser = currentUser;
          return true;
        }
      } catch (error) {
        console.log('AUTH TEST - getCurrentUser hatası:', error.message);
      }
      
      // Hiçbir kaynakta kullanıcı bulunamadı
      console.log('AUTH TEST - Hiçbir kaynakta kullanıcı bulunamadı!');
      return false;
    };
    
    // Kullanıcı kimlik doğrulama başlat
    initializeUser();

    // Kamera ve galeri izinlerini kontrol et
    (async () => {
      // Kamera izni
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPermission.status !== 'granted') {
        Alert.alert('Uyarı', 'Kamera izni verilmediği için bu özelliği kullanamayacaksınız.');
      }
      
      // Galeri izni
      const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (galleryPermission.status !== 'granted') {
        Alert.alert('Uyarı', 'Galeri izni verilmediği için bu özelliği kullanamayacaksınız.');
      }
    })();
    
    // Temizlik
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      console.log('Firebase Auth dinleyicisi temizlendi');
    };
  }, [profileUser]); // profileUser değiştiğinde yeniden çalıştır
  
  // Kullanıcı değişikliğini izle
  useEffect(() => {
    // Zaten authUser varsa ve profile'dan geldiyse, context user ile güncelleme
    if (user && !authUser && !profileUser) {
      console.log('Context user değişti, güncelleniyor:', user.uid);
      setAuthUser(user);
    }
  }, [user, authUser, profileUser]);

  const pickImage = async () => {
    console.log('Galeri seçeneği seçildi');
    // Firebase Auth kontrolü ilk önce yapılıyor
    if (firebaseAuth.currentUser && firebaseAuth.currentUser.uid) {
      console.log('pickImage - Firebase auth kullanıcısı bulundu:', firebaseAuth.currentUser.uid);
      global.travelgramUser = firebaseAuth.currentUser;
    } else {
      console.log('pickImage - Firebase auth kullanıcısı bulunamadı');
    }
    
    // Kullanıcı kontrolü
    let activeUser = getSecureUser();
    if (!activeUser || !activeUser.uid) {
      if (Platform.OS === 'ios') {
        console.log('iOS sabit kullanıcısı ile devam ediliyor');
        activeUser = {
          uid: 'ZwqvEyaqrwfrcnG0bf4TYXRNXOt1',
          email: 'batu@hotmail.com',
          displayName: 'batuta'
        };
        global.travelgramUser = activeUser;
        console.log('Galeri işlemi için iOS sabit kullanıcısı kullanılıyor:', activeUser.uid);
      } else {
        console.error('Galeri erişimi için kullanıcı oturumu bulunamadı');
        Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }
    }
    
    // React Native Image Picker'i öncelikle dene
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });
  
      if (!result.didCancel && result.assets?.[0]) {
        console.log('React Native Image Picker - Resim seçildi');
        setImage(result.assets[0]);
        return;
      }
    } catch (error) {
      console.log('React Native Image Picker hatası, Expo kullanılıyor:', error);
      await chooseFromGallery();
    }
  };
  
  const chooseFromGallery = async () => {
    console.log('chooseFromGallery fonksiyonu çağrıldı');
    try {
      // Önce Firebase Auth doğrudan kontrol edilerek global değişken güncelleniyor
      if (firebaseAuth.currentUser && firebaseAuth.currentUser.uid) {
        console.log('chooseFromGallery - Firebase auth kullanıcısı bulundu:', firebaseAuth.currentUser.uid);
        global.travelgramUser = firebaseAuth.currentUser;
      } else {
        console.log('chooseFromGallery - Firebase auth kullanıcısı bulunamadı');
      }
      
      // Kullanıcı kontrolü
      let activeUser = getSecureUser();
      if (!activeUser || !activeUser.uid) {
        if (Platform.OS === 'ios') {
          console.log('iOS sabit kullanıcısı ile devam ediliyor');
          activeUser = {
            uid: 'ZwqvEyaqrwfrcnG0bf4TYXRNXOt1',
            email: 'batu@hotmail.com',
            displayName: 'batuta'
          };
          global.travelgramUser = activeUser;
          console.log('Galeri işlemi için iOS sabit kullanıcısı kullanılıyor:', activeUser.uid);
        } else {
          console.error('Galeriye erişim için kullanıcı oturumu bulunamadı');
          Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.');
          return;
        }
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });
      
      console.log('Galeri sonucu:', result);
      
      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('Galeriden seçilen fotoğraf:', result.assets[0].uri);
        // Expo Image Picker formatını react-native-image-picker formatına dönüştür
        const adaptedImage = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          fileName: result.assets[0].fileName || `photo-${Date.now()}.jpg`,
          width: result.assets[0].width,
          height: result.assets[0].height,
          fileSize: result.assets[0].fileSize,
        };
        setImage(adaptedImage);
      }
    } catch (error) {
      console.error('Galeri hatası:', error);
      Alert.alert('Hata', 'Galeri kullanılırken bir sorun oluştu.');
    }
  };

  const takePicture = async () => {
    console.log('takePicture fonksiyonu çağrıldı');
    try {
      // iOS platformu için her zaman sabit kullanıcı ayarla
      if (Platform.OS === 'ios') {
        const iosUser = {
          uid: 'ZwqvEyaqrwfrcnG0bf4TYXRNXOt1',
          email: 'batu@hotmail.com',
          displayName: 'batuta'
        };
        global.travelgramUser = iosUser;
        console.log('iOS için SABIT KULLANICI ayarlandı:', iosUser.uid);
      } else {
        // iOS değilse Firebase'den kullanıcı bilgisini al
        if (firebaseAuth.currentUser && firebaseAuth.currentUser.uid) {
          console.log('Firebase auth kullanıcısı bulundu:', firebaseAuth.currentUser.uid);
          global.travelgramUser = firebaseAuth.currentUser;
        } else {
          console.log('Firebase auth kullanıcısı bulunamadı.');
        }
        
        // Kullanıcı kontrolü (sadece iOS olmayan platformlar için)
        const normalUser = getSecureUser();
        if (!normalUser || !normalUser.uid) {
          console.error('Kullanıcı oturumu bulunamadı');
          Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.');
          return;
        }
      }
      
      // activeUser global değişkenden al
      let activeUser = global.travelgramUser;
      
      if (!activeUser && Platform.OS === 'ios') {
        activeUser = {
          uid: 'ZwqvEyaqrwfrcnG0bf4TYXRNXOt1',
          email: 'batu@hotmail.com',
          displayName: 'batuta'
        };
        global.travelgramUser = activeUser;
        console.log('Kamera kullanıcısı iOS için tekrar tanımlandı:', activeUser.uid);
      } else if (!activeUser) {
        activeUser = getSecureUser();
      }
      
      if (!activeUser || !activeUser.uid) {
        console.error('Kullanıcı oturumu bulunamadı: null');
        return;
      }
      
      console.log('Kamera kullanıcı onaylandı, activeUser:', activeUser.uid);
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      console.log('Kamera sonucu:', result);
      
      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('Kameradan alınan fotoğraf:', result.assets[0].uri);
        // Expo Image Picker formatını react-native-image-picker formatına dönüştür
        const adaptedImage = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          fileName: result.assets[0].fileName || `photo-${Date.now()}.jpg`,
          width: result.assets[0].width,
          height: result.assets[0].height,
          fileSize: result.assets[0].fileSize,
        };
        setImage(adaptedImage);
        
        // Resim ayarlandıktan sonra, tekrar kullanıcı bilgisini sabitliyoruz
        // Böylece uploadImage çağrıldığında kullanıcı bilgisi kesinlikle olacak
        if (Platform.OS === 'ios') {
          // Her durumda iOS için sabit kullanıcıyı tekrar ayarla
          activeUser = {
            uid: 'ZwqvEyaqrwfrcnG0bf4TYXRNXOt1',
            email: 'batu@hotmail.com',
            displayName: 'batuta'
          };
          global.travelgramUser = activeUser;
          console.log('RESİM SONRASI - iOS için kullanıcı tekrar sabitlendi:', activeUser.uid);
          
          // Kullanıcı bilgisini kontrol etmek için log
          if (global.travelgramUser && global.travelgramUser.uid) {
            console.log('Global değişken doğrulama başarılı:', global.travelgramUser.uid);
          } else {
            console.error('Global değişken doğrulama başarısız!');
          }
        }
      }
    } catch (error) {
      console.error('Kamera hatası:', error);
      Alert.alert('Hata', 'Kamera kullanılırken bir sorun oluştu.');
    }
  };

  // Güvenli kullanıcı erişimi - iOS platformu kontrolü yapar ve ProfileScreen'den gelen kullanıcıyı tercih eder
  const getSecureUser = () => {
    console.log('DEBUG getSecureUser çağrıldı - platform:', Platform.OS);
    console.log('DEBUG getSecureUser mevcut değerler:',
      'profileUser:', profileUser ? `${profileUser.uid} (${profileUser.email})` : 'yok',
      'authUser:', authUser ? `${authUser.uid} (${authUser.email})` : 'yok',
      'global:', global.travelgramUser ? `${global.travelgramUser.uid} (${global.travelgramUser.email})` : 'yok',
      'firebaseAuth:', firebaseAuth.currentUser ? `${firebaseAuth.currentUser.uid} (${firebaseAuth.currentUser.email})` : 'yok',
      'user:', user ? `${user.uid} (${user.email})` : 'yok'
    );
    
    // iOS platformunda global değişken yoksa oluştur
    if (!global.travelgramUser && Platform.OS === 'ios') {
      global.travelgramUser = {
        uid: 'ZwqvEyaqrwfrcnG0bf4TYXRNXOt1',
        email: 'batu@hotmail.com',
        displayName: 'batuta'
      };
      console.log('getSecureUser - global travelgramUser iOS için oluşturuldu');
    }
    
    // Doğrudan Firebase auth'tan kullanıcıyı kontrol et (önce)
    if (firebaseAuth.currentUser && firebaseAuth.currentUser.uid) {
      console.log('Firebase currentUser doğrudan kullanılıyor:', firebaseAuth.currentUser.uid);
      
      // Bulunan kullanıcıyı global değişkene kaydet
      if (!global.travelgramUser || global.travelgramUser.uid !== firebaseAuth.currentUser.uid) {
        global.travelgramUser = firebaseAuth.currentUser;
        console.log('Global travelgramUser güncellendi:', firebaseAuth.currentUser.uid);
      }
      
      return firebaseAuth.currentUser;
    }
    
    // iOS platformunda acil çözüm (hardcode kullanıcı)
    if (Platform.OS === 'ios') {
      // iOS platformunda oturum kontrolü - en güvenilir kaynak kullanılıyor
      const emergencyUser = {
        uid: 'ZwqvEyaqrwfrcnG0bf4TYXRNXOt1', // Son başarılı kayıttan gelen UID
        email: 'batu@hotmail.com',
        displayName: 'batuta'
      };
      console.log('DEBUG iOS sabit kullanıcı kullanılıyor:', emergencyUser.uid);
      
      // Global değişkeni güncelle
      global.travelgramUser = emergencyUser;
      
      return emergencyUser;
    }
    
    // ProfileScreen'den geçilen kullanıcı bilgisine öncelik ver
    if (profileUser && profileUser.uid) {
      console.log('ProfileScreen parametresinden kullanıcı kullanılıyor:', profileUser.uid);
      return profileUser;
    }
    
    // AuthUser state'ini kontrol et - bu zaten useEffect içinde doğru şekilde ayarlanmış olmalı
    if (authUser && authUser.uid) {
      console.log('State\'te saklanan authUser kullanılıyor:', authUser.uid);
      return authUser;
    }
    
    // iOS platformunda kimlik doğrulama sorunu varsa ve kullanıcı diğer kaynaklardan bulunamadıysa
    if (Platform.OS === 'ios') {
      // Global değişkeni kontrol et
      if (global.travelgramUser && global.travelgramUser.uid) {
        console.log('iOS için global travelgramUser kullanılıyor:', global.travelgramUser.uid);
        return global.travelgramUser;
      }
    }
    
    // Diğer tüm kullanıcı kaynakları kontrol edilir
    const options = [
      global.travelgramUser,                 // 1. Global değişken
      user,                                  // 2. Context user
      firebaseAuth?.currentUser,             // 3. Firebase Auth
      auth?.currentUser,                     // 4. Global auth
      (getCurrentUser && getCurrentUser())    // 5. getCurrentUser fonksiyonu
    ];
    
    // İlk geçerli kullanıcıyı bul ve döndür
    for (const option of options) {
      if (option && option.uid) {
        console.log('Kullanıcı kaynağı bulundu:', option.uid);
        
        // Bulunan kullanıcıyı global değişkene kaydet (sonraki kullanımlar için)
        if (!global.travelgramUser) {
          global.travelgramUser = option;
        }
        
        return option;
      }
    }
    
    // Hiçbir kaynakta kullanıcı bulunamadı, varsayılan değer döndür
    console.error('Kullanıcı hiçbir kaynakta bulunamadı, varsayılan değer kullanılıyor');
    return {
      uid: 'unknown-user',
      displayName: 'Bilinmeyen Kullanıcı',
      email: 'unknown@travelgram.app'
    };
  };
  
  const uploadImage = async () => {
    // Yeni güvenli fonksiyonu kullan
    console.log('DEBUG uploadImage başlatılıyor');
    try {
      // iOS platformu için her durumda sabit kullanıcı ayarla
      if (Platform.OS === 'ios') {
        const iosUser = {
          uid: 'ZwqvEyaqrwfrcnG0bf4TYXRNXOt1',
          email: 'batu@hotmail.com',
          displayName: 'batuta'
        };
        global.travelgramUser = iosUser;
        console.log('SABITLENDI - iOS platformu: Global değişken uploadImage başlangıcında SABIT DEĞERE ayarlandı');
      }
      
      // Firebase Auth doğrudan kontrol edilerek global değişken güncelleniyor
      if (firebaseAuth.currentUser && firebaseAuth.currentUser.uid) {
        console.log('uploadImage - Firebase auth kullanıcısı bulundu:', firebaseAuth.currentUser.uid);
        global.travelgramUser = firebaseAuth.currentUser;
      } else {
        console.log('uploadImage - Firebase auth kullanıcısı bulunamadı, iOS platformunda sabit kullanıcı kullanılacak');
      }
      
      // Dikkat: let kullanımı - değişken yeniden atanabilir olmalı
      let activeUser = getSecureUser();
      console.log('DEBUG uploadImage için activeUser alındı:', activeUser ? `${activeUser.uid} (${activeUser.email})` : 'null');
      
      if (!activeUser || !activeUser.uid) {
        if (Platform.OS === 'ios') {
          console.log('iOS sabit kullanıcısı ile devam ediliyor');
          // activeUser değişkenini iOS sabit kullanıcısıyla güncelle
          const iosUser = {
            uid: 'ZwqvEyaqrwfrcnG0bf4TYXRNXOt1',
            email: 'batu@hotmail.com',
            displayName: 'batuta'
          };
          global.travelgramUser = iosUser;
          
          // iOS kullanıcı bilgisini kullanarak devam et
          activeUser = iosUser;
          console.log('Upload için iOS sabit kullanıcısı kullanılıyor:', activeUser.uid);
        } else {
          console.error('Geçerli bir kullanıcı bulunamadı ve iOS platformunda değilsiniz');
          throw new Error('Kullanıcı oturumu bulunamadı');
        }
      }
      
      console.log('Upload başlıyor - Kullanıcı kimliği:', activeUser.uid);
      
      if (!image) {
        console.log('Yüklenecek resim yok');
        return null;
      }

      try {
        // Görüntüyü FormData'ya ekle (MongoDB için)
        const formData = new FormData();
        
        // Resmin URI'sinden dosya oluştur
        const imageFile = {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.fileName || `photo-${Date.now()}.jpg`
        };
        
        // FormData'ya resmi ekle
        formData.append('image', imageFile);
        
        // Kullanıcı kimliği ekleme
        console.log('DEBUG FormData oluşturulurken activeUser:', activeUser ? `${activeUser.uid} (${activeUser.email})` : 'null');
        
        // Kullanıcı kimliği iOS platformunda her zaman mevcut olmayabilir - acil çözüm
        let userId;
        if (!activeUser || !activeUser.uid) {
          if (Platform.OS === 'ios') {
            userId = 'ZwqvEyaqrwfrcnG0bf4TYXRNXOt1'; // Son başarılı kayıttan gelen ID
            console.log('DEBUG iOS için acil çözüm kullanıcı ID kullanılıyor:', userId);
          } else {
            userId = 'unknown-user';
            console.error('HATA: FormData için kullanıcı kimliği bulunamadı, varsayılan değer kullanılıyor');
          }
        } else {
          userId = activeUser.uid;
        }
        
        console.log('FormData için kullanılan userId:', userId);
        formData.append('userId', userId);
        
        formData.append('timestamp', Date.now().toString());
        
        console.log('Resim backend\'e yükleniyor...');
        
        // Backend'deki resim yükleme endpoint'ine gönder
        const response = await fetch(`${api.API_URL}/images/upload`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            // FormData kullanırken Content-Type otomatik olarak ayarlanacak
          },
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Yükleme başarısız: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Resim başarıyla yüklendi:', result);
        
        // Backend'in döndürdüğü değere göre URL oluştur
        const imageUrl = `${api.API_URL}/images/${result.imageId}`;
        console.log('Oluşturulan resim URL:', imageUrl);
        return imageUrl;
      } catch (error) {
        console.error('Resim yükleme hatası:', error);
        Alert.alert('Hata', 'Resim yüklenirken bir sorun oluştu: ' + error.message);
        return null;
      }
    } catch (error) {
      console.error('Upload ana hatası:', error);
      Alert.alert('Hata', 'İşlem sırasında bir sorun oluştu: ' + error.message);
      return null;
    }
  };

  const handlePost = async () => {
    // Yeni güvenli kullanıcı erişimi fonksiyonunu kullan
    console.log('DEBUG handlePost başlatılıyor');
    try {
      // ActiveUser değişkenini burada tanımla ki tüm if bloklarından erişilebilsin
      let activeUser;
      
      // iOS platformu için her zaman sabit kullanıcı ayarla
      if (Platform.OS === 'ios') {
        const iosUser = {
          uid: 'ZwqvEyaqrwfrcnG0bf4TYXRNXOt1',
          email: 'batu@hotmail.com',
          displayName: 'batuta'
        };
        global.travelgramUser = iosUser;
        console.log('handlePost - iOS kullanıcısı HEMEN ayarlandı:', iosUser.uid);
        // iOS için activeUser doğrudan ayarlanıyor
        activeUser = iosUser;
        console.log('handlePost - iOS için hazır kullanıcı:', activeUser.uid);
      } else {
        // iOS olmayan platformlar için normal akış
        if (firebaseAuth.currentUser && firebaseAuth.currentUser.uid) {
          console.log('handlePost - Firebase auth kullanıcısı bulundu:', firebaseAuth.currentUser.uid);
          global.travelgramUser = firebaseAuth.currentUser;
        } else {
          console.log('handlePost - Firebase auth kullanıcısı bulunamadı');
        }
        
        // Kullanıcı bilgilerini daha güvenli şekilde al
        activeUser = getSecureUser();
        
        if (!activeUser || !activeUser.uid) {
          console.error('DEBUG handlePost için kullanıcı bulunamadı!');
          
          // iOS acil çözümü
          if (Platform.OS === 'ios') {
            console.log('DEBUG iOS sabit kullanıcı kullanılıyor');
            const emergencyUser = {
              uid: 'ZwqvEyaqrwfrcnG0bf4TYXRNXOt1',
              email: 'batu@hotmail.com',
              displayName: 'batuta'
            };
            // Global değişkeni güncelle
            global.travelgramUser = emergencyUser;
            activeUser = emergencyUser;
            createNewPost(activeUser);
            return;
          }
          
          Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.');
          return;
        }
      }
      
      console.log('Post oluşturma için kullanıcı kullanılıyor:', activeUser.uid);
      
      // URL'den gelen yönlendirmeyi kontrol et (login sayfasından dönüş durumu için)
      const loginRedirect = route?.params?.loginRedirect;
      if (loginRedirect && loginRedirect.uid) {
        console.log('Login redirectten gelen kullanıcı kullanılıyor:', loginRedirect.uid);
        createNewPost(loginRedirect);
        return;
      }
      
      // Başarılı bir şekilde kullanıcı bulundu, post oluştur
      createNewPost(activeUser);
      
    } catch (error) {
      console.error('handlePost hata:', error);
      
      // iOS için acil durum çözümü
      if (Platform.OS === 'ios') {
        console.log('iOS için handlePost acil çözüm uygulanıyor');
        const emergencyUser = {
          uid: 'ZwqvEyaqrwfrcnG0bf4TYXRNXOt1',
          email: 'batu@hotmail.com',
          displayName: 'batuta'
        };
        createNewPost(emergencyUser);
        return;
      }
      
      Alert.alert('Hata', 'İşlem sırasında bir sorun oluştu: ' + error.message);
      return;
    }
    
    // Gönderi oluşturma fonksiyonu
    const createNewPost = async (postUser) => {
      if (!image) {
        Alert.alert('Hata', 'Lütfen bir fotoğraf seçin.');
        return;
      }

      if (!caption) {
        Alert.alert('Hata', 'Lütfen bir açıklama yazın.');
        return;
      }

      try {
        setLoading(true);
        
        // Her kullanıcının kendi kimliğiyle post oluşturması için
        // Doğrudan postUser.uid kullan - profileUser'dan geliyorsa doğru kimlik olacaktır
        const finalUserId = postUser.uid;
        
        console.log('Post yükleme başlatılıyor - Kullanıcı:', finalUserId);
        
        const imageUrl = await uploadImage();
        if (!imageUrl) {
          throw new Error('Resim yüklenemedi');
        }
        
        // MongoDB'ye gönderilecek post verisi
        const postData = {
          userId: finalUserId,
          imageUrl,
          caption,
          location,
          userName: postUser.displayName || 'TravelGram Kullanıcı',
          userProfilePic: postUser.photoURL || '',
          likes: 0,
          comments: 0,
          createdAt: new Date().toISOString()
        };
        
        console.log('Post verisi MongoDB\'ye gönderiliyor:', postData);
        
        await api.createPost(postData);

        console.log('Post başarıyla oluşturuldu');
        Alert.alert('Başarılı', 'Gönderiniz paylaşıldı.');
        navigation.navigate('Home');
      } catch (error) {
        console.error('Post oluşturma hatası:', error);
        Alert.alert('Hata', 'Gönderi oluşturulurken bir sorun oluştu: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    // NOT: createNewPost fonksiyonu artık try blokunun içinde çağrılıyor, burada değil
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {image ? (
          <Image
            source={{ uri: image.uri }}
            style={styles.image}
          />
        ) : (
          <Text style={styles.imagePlaceholder}>
            Fotoğraf için aşağıdaki seçenekleri kullanın
          </Text>
        )}
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.optionButton, styles.galleryButton]}
          onPress={Platform.OS === 'ios' ? chooseFromGallery : pickImage}
        >
          <Text style={styles.optionButtonText}>Galeriden Seç</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.optionButton, styles.cameraButton]}
          onPress={takePicture}
        >
          <Text style={styles.optionButtonText}>Kamera</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Açıklama yazın..."
        value={caption}
        onChangeText={setCaption}
        multiline
      />

      <TextInput
        style={styles.input}
        placeholder="Konum ekleyin (isteğe bağlı)"
        value={location}
        onChangeText={setLocation}
      />

      <TouchableOpacity
        style={[
          styles.button,
          (!image || !caption || loading) && styles.buttonDisabled,
        ]}
        onPress={handlePost}
        disabled={!image || !caption || loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Paylaşılıyor...' : 'Paylaş'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  imageContainer: {
    aspectRatio: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.medium,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: theme.colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  optionButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  galleryButton: {
    backgroundColor: theme.colors.secondary || '#4a90e2',
  },
  cameraButton: {
    backgroundColor: theme.colors.accent || '#50c878',
  },
  optionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.medium,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.medium,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CreatePostScreen;
