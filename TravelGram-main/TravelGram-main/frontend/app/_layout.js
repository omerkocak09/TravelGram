import { Stack, useRouter, usePathname } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useEffect } from 'react';
import CustomNavHeader from '../components/CustomNavHeader';
import { View, StyleSheet } from 'react-native';
import { setAuthContextInstance } from '../src/services/imageService';

export default function Layout() {
  // AuthContext'e tam erişim sağla
  const authContext = useAuth();
  const { user } = authContext;
  const router = useRouter();

  useEffect(() => {
    // AuthContext örneğini global olarak ayarla
    // Dikkat: getCurrentUser() fonksiyonunu burada çağırmayalım, sadece context'i ayarlayalım
    console.log('AuthContext örneği ana layoutta ayarlanacak...');
    setAuthContextInstance(authContext);
    console.log('AuthContext örneği ayarlandı, user durumu:', user ? 'var' : 'yok');
    
    // Kullanıcı durumuna göre yönlendirme
    if (!user) {
      console.log('Kullanıcı bulunamadı, giriş sayfasına yönlendiriliyor');
      router.replace('/(auth)/login');
    } else {
      console.log('Kullanıcı bulundu, ana sayfaya yönlendiriliyor');
      router.replace('/(tabs)/home/index');
    }
  }, [user, authContext]);
  
  // Şu anki URL yolunu al
  const pathname = usePathname();
  
  // Auth rotasında olup olmadığını kontrol et
  const isAuthRoute = pathname.includes('(auth)');
  
  // Debug bilgileri kaldırıldı
  
  return (
    <View style={styles.container}>
      <Stack
        style={styles.stack}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      
      {/* Navigasyon çubuğu tabs layout'a taşındı */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative', // Pozisyonu relative yap
    paddingBottom: 70,    // Alt navigasyon için boşluk bırak
  },
  stack: {
    flex: 1,
  }
});
