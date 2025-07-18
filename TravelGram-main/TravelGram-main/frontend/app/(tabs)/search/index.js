import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ref, query, orderByChild, startAt, endAt, get } from 'firebase/database';
import { db } from '../../../src/firebaseConfig';

const { width } = Dimensions.get('window');
const POST_SIZE = width / 2 - 15;

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('location'); // 'location' veya 'user'
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // Son aramaları localStorage'dan yükle
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      // Son aramalar burada yüklenecek
      setRecentSearches([
        'İstanbul',
        'Kapadokya',
        'Antalya',
        'İzmir',
      ]);
    } catch (error) {
      console.error('Son aramalar yüklenirken hata:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      let searchResults = [];

      if (searchType === 'location') {
        // Konuma göre arama
        const postsRef = query(
          ref(db, 'posts'),
          orderByChild('location'),
          startAt(searchQuery.toLowerCase()),
          endAt(searchQuery.toLowerCase() + '\uf8ff')
        );
        
        const snapshot = await get(postsRef);
        if (snapshot.exists()) {
          searchResults = Object.entries(snapshot.val()).map(([id, post]) => ({
            id,
            ...post,
          }));
        }
      } else {
        // Kullanıcıya göre arama
        const usersRef = query(
          ref(db, 'users'),
          orderByChild('username'),
          startAt(searchQuery.toLowerCase()),
          endAt(searchQuery.toLowerCase() + '\uf8ff')
        );
        
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
          const users = Object.values(snapshot.val());
          // Kullanıcıların gönderilerini al
          for (const user of users) {
            const userPostsRef = query(
              ref(db, 'posts'),
              orderByChild('userId'),
              startAt(user.uid),
              endAt(user.uid + '\uf8ff')
            );
            
            const userPostsSnapshot = await get(userPostsRef);
            if (userPostsSnapshot.exists()) {
              const userPosts = Object.entries(userPostsSnapshot.val()).map(([id, post]) => ({
                id,
                ...post,
              }));
              searchResults.push(...userPosts);
            }
          }
        }
      }

      // Sonuçları tarihe göre sırala
      searchResults.sort((a, b) => b.createdAt - a.createdAt);
      setResults(searchResults);

      // Son aramalara ekle
      if (!recentSearches.includes(searchQuery)) {
        const updatedSearches = [searchQuery, ...recentSearches].slice(0, 5);
        setRecentSearches(updatedSearches);
        // localStorage'a kaydet
      }
    } catch (error) {
      console.error('Arama hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => router.push(`/post/${item.id}`)}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.resultImage}
        resizeMode="cover"
      />
      <View style={styles.resultOverlay}>
        <Text style={styles.resultLocation} numberOfLines={1}>
          {item.location}
        </Text>
        <View style={styles.resultStats}>
          <MaterialIcons name="favorite" size={16} color="#fff" />
          <Text style={styles.resultStatText}>
            {item.likes?.length || 0}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={24} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder={
              searchType === 'location'
                ? 'Konum ara...'
                : 'Kullanıcı ara...'
            }
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <MaterialIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.searchTypeContainer}>
          <TouchableOpacity
            style={[
              styles.searchTypeButton,
              searchType === 'location' && styles.activeSearchType,
            ]}
            onPress={() => setSearchType('location')}
          >
            <MaterialIcons
              name="place"
              size={20}
              color={searchType === 'location' ? '#1565c0' : '#666'}
            />
            <Text
              style={[
                styles.searchTypeText,
                searchType === 'location' && styles.activeSearchTypeText,
              ]}
            >
              Konum
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.searchTypeButton,
              searchType === 'user' && styles.activeSearchType,
            ]}
            onPress={() => setSearchType('user')}
          >
            <MaterialIcons
              name="person"
              size={20}
              color={searchType === 'user' ? '#1565c0' : '#666'}
            />
            <Text
              style={[
                styles.searchTypeText,
                searchType === 'user' && styles.activeSearchTypeText,
              ]}
            >
              Kullanıcı
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1565c0" />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.resultRow}
          contentContainerStyle={styles.resultsList}
        />
      ) : (
        <View style={styles.recentContainer}>
          <Text style={styles.recentTitle}>Son Aramalar</Text>
          {recentSearches.map((search, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recentItem}
              onPress={() => {
                setSearchQuery(search);
                handleSearch();
              }}
            >
              <MaterialIcons name="history" size={20} color="#666" />
              <Text style={styles.recentText}>{search}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  searchTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  searchTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activeSearchType: {
    backgroundColor: '#e3f2fd',
  },
  searchTypeText: {
    marginLeft: 5,
    color: '#666',
    fontSize: 14,
  },
  activeSearchTypeText: {
    color: '#1565c0',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsList: {
    padding: 10,
  },
  resultRow: {
    justifyContent: 'space-between',
  },
  resultItem: {
    width: POST_SIZE,
    height: POST_SIZE,
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 10,
    justifyContent: 'space-between',
  },
  resultLocation: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  resultStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultStatText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '500',
  },
  recentContainer: {
    padding: 20,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recentText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  },
});
