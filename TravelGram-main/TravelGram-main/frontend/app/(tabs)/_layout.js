import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import CustomNavHeader from '../../components/CustomNavHeader';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1, paddingBottom: 60 }}>
      <Tabs
        screenOptions={{
          // Tab bar'ı göster
          tabBarStyle: null, // Gizleme özelliğini kaldır
          // Header'ı özelleştir
          headerStyle: {
            backgroundColor: '#1e88e5',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search/index"
        options={{
          title: 'Arama',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="post/create"
        options={{
          title: 'Paylaş',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications/index"
        options={{
          title: 'Bildirimler',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="notifications" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
    
    {/* Alt navigasyon çubuğunu ekleyelim */}
    <CustomNavHeader />
  </View>
  );
}
