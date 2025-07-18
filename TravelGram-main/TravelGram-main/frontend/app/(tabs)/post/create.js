import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { analyzeImage, generateDescription, calculateScore } from '../../../src/services/aiService';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { ref, push, set } from 'firebase/database';
import { db } from '../../../src/firebaseConfig';
import { uploadImageToMongoDB, setAuthContextInstance } from '../../../src/services/imageService';

export default function CreatePostScreen() {
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const authContext = useAuth();
  const { user } = authContext;
  const router = useRouter();

  useEffect(() => {
    // AuthContext'i imageService'e ekleyelim
    console.log('CreatePostScreen - AuthContext instance paylaşılıyor...');
    setAuthContextInstance(authContext);
    
    (async () => {
      // Kamera izni
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== 'granted') {
        Alert.alert('Üzgünüz', 'Kamera erişim izni gerekiyor.');
      }
      
      // Galeri izni
      const { status: imageStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (imageStatus !== 'granted') {
        Alert.alert('Üzgünüz', 'Fotoğraf erişim izni gerekiyor.');
      }

      // Konum izni
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        Alert.alert('Üzgünüz', 'Konum erişim izni gerekiyor.');
      }

      // Mikrofon izni
      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      if (audioStatus !== 'granted') {
        Alert.alert('Üzgünüz', 'Mikrofon erişim izni gerekiyor.');
      }
    })();
  }, []);

  const pickImage = async () => {
    // Kullanıcıya seçenek sun
    Alert.alert(
      'Fotoğraf Seç',
      'Fotoğrafı nereden seçmek istersiniz?',
      [
        {
          text: 'Kamera',
          onPress: () => {
            console.log('Kamera seçeneği seçildi');
            takePicture();
          },
        },
        {
          text: 'Galeri',
          onPress: () => {
            console.log('Galeri seçeneği seçildi');
            chooseFromGallery();
          },
        },
        {
          text: 'İptal',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const takePicture = async () => {
    console.log('takePicture fonksiyonu çağrıldı');
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      console.log('Kamera sonucu:', result);
      
      if (!result.canceled) {
        console.log('Kameradan alınan fotoğraf:', result.assets[0].uri);
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Kamera hatası:', error);
      Alert.alert('Hata', 'Kamera açılırken bir hata oluştu: ' + error.message);
    }
  };

  const chooseFromGallery = async () => {
    console.log('chooseFromGallery fonksiyonu çağrıldı');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      console.log('Galeri sonucu:', result);
      
      if (!result.canceled) {
        console.log('Galeriden seçilen fotoğraf:', result.assets[0].uri);
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Galeri hatası:', error);
      Alert.alert('Hata', 'Galeri açılırken bir hata oluştu: ' + error.message);
    }
  };

  const getLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address[0]) {
        const { city, region } = address[0];
        setLocation(city && region ? `${city}, ${region}` : 'Konum bulunamadı');
      }
    } catch (error) {
      Alert.alert('Hata', 'Konum alınamadı.');
    }
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Hata', 'Ses kaydı başlatılamadı.');
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
      setIsRecording(false);
    } catch (error) {
      Alert.alert('Hata', 'Ses kaydı durdurulamadı.');
    }
  };

  const uploadFile = async (uri, path) => {
    console.log('MongoDB\'ye resim yükleme başlıyor...');
    try {
      // AuthContext'i doğru şekilde ayarla
      setAuthContextInstance(authContext);
      
      console.log('Kullanıcı doğrulama katmanları başlıyor...');
      
      // 1. KATMAN: AuthContext içindeki kullanıcı doğrudan mevcut mu?
      let activeUser = user;
      console.log('1. Katman - AuthContext.user:', activeUser ? activeUser.uid : 'YOK');
      
      // 2. KATMAN: Firebase auth'dan mevcut kullanıcıyı al
      if (!activeUser || !activeUser.uid) {
        // Modern import yöntemi kullanalım
        const { getAuth } = require('firebase/auth');
        const currentAuth = getAuth();
        const firebaseUser = currentAuth.currentUser;
        
        if (firebaseUser && firebaseUser.uid) {
          console.log('2. Katman - Firebase doğrudan kullanıcı bulundu:', firebaseUser.uid);
          activeUser = firebaseUser;
        } else {
          console.log('2. Katman - Firebase doğrudan kullanıcı YOK');
        }
      }
      
      // 3. KATMAN: imageService.getAuthUser()'u kullan
      if (!activeUser || !activeUser.uid) {
        const serviceUser = getAuthUser();
        if (serviceUser && serviceUser.uid) {
          console.log('3. Katman - imageService.getAuthUser() bulundu:', serviceUser.uid);
          activeUser = serviceUser;
        } else {
          console.log('3. Katman - imageService.getAuthUser() kullanıcı YOK');
        }
      }
      
      // 4. KATMAN: Alternatif Firebase Auth yöntemi
      if (!activeUser || !activeUser.uid) {
        const { getAuth } = require('firebase/auth');
        const altAuth = getAuth(app); // app parametresi ile tekrar dene
        const altUser = altAuth.currentUser;
        
        if (altUser && altUser.uid) {
          console.log('4. Katman - Alternatif Firebase Auth bulundu:', altUser.uid);
          activeUser = altUser;
        } else {
          console.log('4. Katman - Alternatif Firebase Auth kullanıcı YOK');
        }
      }
      
      // Son kontrol
      if (!activeUser || !activeUser.uid) {
        console.error('Hiçbir yöntemle kullanıcı bulunamadı!');
        Alert.alert('Oturum Hatası', 'Kullanıcı oturumu doğrulanamadı. Lütfen tekrar giriş yapın.');
        router.replace('/(auth)/login');
        throw new Error('Kullanıcı oturumu bulunamadı');
      }
      
      // Başarılı - bulduğumuz kullanıcı ile devam edelim
      console.log('Kullanıcı doğrulama başarılı:', activeUser.uid, activeUser.email || 'email yok');
      
      // Yükleme bilgilerini hazırla
      const description = ''; // Gönderinin açıklaması gönderi oluşturulurken eklenecek
      const locationText = location || '';
      
      // Kullanıcı tokeni ile ek doğrulama yapalım
      try {
        const token = await activeUser.getIdToken(true);
        console.log('Kullanıcı tokeni alındı:', token ? 'Başarılı' : 'Başarısız');
      } catch (tokenError) {
        console.warn('Token alınamadı ama işleme devam edilecek:', tokenError.message);
      }
      
      // MongoDB'ye resmi yükle - geliştirilmiş kullanıcı bilgisiyle
      console.log('uploadImageToMongoDB servisi çağrılıyor...');
      const imageUrl = await uploadImageToMongoDB(uri, description, locationText);
      
      if (!imageUrl) {
        throw new Error('Resim yükleme başarısız: Geçerli bir URL dönmedi');
      }
      
      console.log('MongoDB\'ye resim yüklendi, URL:', imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('MongoDB resim yükleme hatası:', error);
      Alert.alert('Yükleme Hatası', `Resim yüklenirken bir hata oluştu: ${error.message}`);
      throw error;
    }
  };

  const handlePost = async () => {
    if (!image) {
      Alert.alert('Uyarı', 'Lütfen bir fotoğraf seçin.');
      return;
    }

    // Kullanıcı kimlik kontrolü
    if (!user || !user.uid) {
      console.error('Kullanıcı oturumu bulunamadı:', user);
      Alert.alert('Hata', 'Oturum açmanız gerekiyor. Lütfen tekrar giriş yapın.');
      return;
    }

    console.log('Paylaşım başlıyor, kullanıcı:', user.uid, user.displayName);
    setIsLoading(true);

    try {
      // Fotoğraf yükleme - MongoDB'ye
      console.log('Fotoğraf MongoDB\'ye yükleniyor...');
      const imageUrl = await uploadFile(
        image,
        `posts/${user.uid}/${Date.now()}_image.jpg`
      );
      console.log('Fotoğraf MongoDB\'ye yüklendi:', imageUrl);

      // Ses dosyası yükleme (varsa) - Firebase Realtime Database'e
      let audioUrl = null;
      if (audioUri) {
        console.log('Ses dosyası yükleniyor...');
        // Ses dosyalarını henüz MongoDB'ye taşımadık, Firebase'de kalabilir
        const audioPath = `posts/${user.uid}/${Date.now()}_audio.m4a`;
        const dbPath = audioPath.replace(/\//g, '_');
        const audioRef = ref(db, `audio/${dbPath}`);
        
        // Ses dosyasını base64'e dönüştürme
        const response = await fetch(audioUri);
        const blob = await response.blob();
        const reader = new FileReader();
        
        // Promise olarak işle
        const audioData = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        
        // Firebase'e kaydet
        await set(audioRef, {
          base64: audioData,
          createdAt: Date.now(),
          userId: user.uid
        });
        
        audioUrl = `db://audio/${dbPath}`;
        console.log('Ses dosyası yüklendi:', audioUrl);
      }

      // AI analizlerini yap
      console.log('AI analizleri yapılıyor...');
      const [aiDesc, aiScoreData] = await Promise.all([
        generateDescription(imageUrl),
        calculateScore(imageUrl)
      ]);
      console.log('AI analizleri tamamlandı:', { aiDesc, aiScore: aiScoreData.score });

      // Yeni gönderi oluştur
      console.log('Gönderi veritabanına kaydediliyor...');
      const postRef = push(ref(db, 'posts'));
      await set(postRef, {
        userId: user.uid,
        username: user.displayName || 'İsimsiz Kullanıcı',
        userPhoto: user.photoURL || null,
        imageUrl,
        audioUrl,
        description: description || aiDesc.text,
        location,
        createdAt: Date.now(),
        likes: [],
        comments: [],
        aiScore: aiScoreData.score,
        aiDescription: aiDesc.text,
      });
      console.log('Gönderi başarıyla kaydedildi! ID:', postRef.key);

      Alert.alert('Başarılı', 'Gönderiniz paylaşıldı!');
      router.push('/home');
    } catch (error) {
      console.error('Gönderi paylaşma hatası:', error);
      
      // Firebase hata kodlarına göre özel mesajlar
      let errorMessage = 'Gönderi paylaşılırken bir hata oluştu.';
      
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'Fotoğraf yükleme izniniz yok. Firebase Storage kurallarını kontrol edin.';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Veritabanına yazma izniniz yok. Firebase Database kurallarını kontrol edin.';
      }
      
      Alert.alert('Hata', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yeni Gönderi</Text>
      </View>

      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
            <MaterialIcons name="add-a-photo" size={50} color="#666" />
            <Text style={styles.imagePlaceholderText}>Fotoğraf Ekle</Text>
          </TouchableOpacity>
        )}

        {image && (
          <TouchableOpacity style={styles.changeImageButton} onPress={pickImage}>
            <Text style={styles.changeImageText}>Değiştir</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Açıklama ekle..."
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity style={styles.locationButton} onPress={getLocation}>
          <MaterialIcons name="location-on" size={24} color="#1DA1F2" />
          <Text style={styles.locationText}>
            {location || 'Konum ekle'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.recordButton}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <MaterialIcons name={isRecording ? 'stop' : 'mic'} size={24} color={isRecording ? '#FF6347' : '#1DA1F2'} />
          <Text style={[styles.recordText, isRecording && { color: '#FF6347' }]}>
            {isRecording ? 'Kaydı Durdur' : audioUri ? 'Ses Kaydedildi' : 'Ses Kaydet'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.postButton, (!image || isLoading) && styles.disabledButton]}
          onPress={handlePost}
          disabled={!image || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="send" size={24} color="#fff" />
              <Text style={styles.postButtonText}>Paylaş</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  image: {
    width: 300,
    height: 300,
    borderRadius: 10,
  },
  imagePlaceholder: {
    width: 300,
    height: 300,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    marginTop: 10,
    color: '#666',
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  changeImageText: {
    color: 'white',
    fontWeight: 'bold',
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  locationText: {
    marginLeft: 5,
    color: '#1DA1F2',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  recordText: {
    marginLeft: 5,
    color: '#1DA1F2',
  },
  postButton: {
    backgroundColor: '#1DA1F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#A9D0F5',
  },
  postButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
