import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { lightTheme as theme } from '../../utils/theme';

const ProfileScreen = ({ navigation }) => {
  const { user, signOut, getCurrentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState(null);
  
  // Aktif kullanıcı bilgisini al ve sakla
  useEffect(() => {
    const fetchActiveUser = () => {
      // Önce context'teki user'ı kontrol et
      if (user) {
        console.log('ProfileScreen: Context user bulundu', user.uid);
        setActiveUser(user);
        return;
      }
      
      // Context'te yoksa getCurrentUser() ile dene
      const currentUser = getCurrentUser && getCurrentUser();
      if (currentUser) {
        console.log('ProfileScreen: getCurrentUser ile user bulundu', currentUser.uid);
        setActiveUser(currentUser);
        return;
      }
      
      console.log('ProfileScreen: Aktif kullanıcı bulunamadı');
    };
    
    fetchActiveUser();
  }, [user, getCurrentUser]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // Aktif kullanıcıyı kullan, yoksa context user'ı dene
      const userToFetch = activeUser || user;
      
      if (!userToFetch || !userToFetch.uid) {
        console.error('Profil yüklenirken hata: Kullanıcı bilgisi yok');
        Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }
      
      console.log('Profil yükleniyor:', userToFetch.uid);
      const profileData = await api.getUser(userToFetch.uid);
      setProfile(profileData);
      setPosts(profileData.posts || []);
    } catch (error) {
      console.error('Profil yüklenirken hata:', error);
      Alert.alert('Hata', 'Profil bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
    }
  };

  // CreatePost ekranına geçiş yap - user bilgisini de aktar
  const navigateToCreatePost = () => {
    // Aktif kullanıcıyı veya context user'ı kullan
    const userToPass = activeUser || user;
    
    if (!userToPass) {
      console.error('CreatePost ekranına geçiş hatası: Kullanıcı bilgisi yok');
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }
    
    console.log('CreatePost ekranına geçiliyor, user bilgisi aktarılıyor:', userToPass.uid);
    navigation.navigate('CreatePost', { user: userToPass });
  };
  
  const renderHeader = () => (
    <View style={styles.header}>
      <Image
        source={{ uri: profile?.avatar }}
        style={styles.avatar}
      />
      
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{posts.length}</Text>
          <Text style={styles.statLabel}>Gönderi</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{profile?.followers?.length || 0}</Text>
          <Text style={styles.statLabel}>Takipçi</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{profile?.following?.length || 0}</Text>
          <Text style={styles.statLabel}>Takip</Text>
        </View>
      </View>
    </View>
  );

  const renderBio = () => (
    <View style={styles.bioSection}>
      <Text style={styles.username}>{profile?.username}</Text>
      {profile?.bio && (
        <Text style={styles.bio}>{profile.bio}</Text>
      )}
      
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Text style={styles.editButtonText}>Profili Düzenle</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPost = ({ item }) => (
    <TouchableOpacity
      style={styles.postItem}
      onPress={() => navigation.navigate('PostDetail', { post: item })}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.postImage}
      />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>{profile?.username}</Text>
        <View style={styles.topBarButtons}>
          <TouchableOpacity 
            style={styles.topBarButton} 
            onPress={navigateToCreatePost}
          >
            <Icon name="add-circle" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.topBarButton} 
            onPress={handleSignOut}
          >
            <Icon name="logout" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        numColumns={3}
        ListHeaderComponent={
          <>
            {renderHeader()}
            {renderBio()}
          </>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  topBarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBarButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  screenTitle: {
    ...theme.typography.h2,
  },
  header: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: theme.colors.textSecondary,
  },
  bioSection: {
    padding: theme.spacing.lg,
  },
  username: {
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  bio: {
    marginBottom: theme.spacing.md,
  },
  editButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.medium,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  editButtonText: {
    fontWeight: '500',
  },
  postItem: {
    flex: 1/3,
    aspectRatio: 1,
    padding: 1,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
});

export default ProfileScreen;
