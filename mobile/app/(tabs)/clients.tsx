import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { fetchClients } from '../../lib/api';
import { colors } from '../../lib/theme';

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function ClientsScreen() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadClients = async () => {
    try {
      const data = await fetchClients();
      setClients(data || []);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [])
  );

  const filtered = search.trim()
    ? clients.filter(c => {
        const q = search.toLowerCase();
        return (c.name || '').toLowerCase().includes(q) ||
               (c.company || '').toLowerCase().includes(q) ||
               (c.email || '').toLowerCase().includes(q);
      })
    : clients;

  const onRefresh = () => {
    setRefreshing(true);
    loadClients();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.green;
      case 'prospect': return colors.teal;
      case 'lead': return colors.amber;
      default: return colors.gray;
    }
  };

  const renderClient = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.clientCard}
      onPress={() => router.push(`/client/${item.id}`)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
      </View>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.name}</Text>
        <Text style={styles.clientMeta}>{item.company || item.email || ''}</Text>
        <View style={styles.tags}>
          <View style={[styles.tag, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.tagText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors.gray}
        />
      </View>

      <FlatList
        data={filtered}
        renderItem={renderClient}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {search ? 'No clients match your search' : 'No clients yet'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.dark,
  },
  list: {
    padding: 16,
    paddingTop: 4,
  },
  clientCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
  },
  clientMeta: {
    fontSize: 13,
    color: colors.gray,
    marginTop: 2,
  },
  tags: {
    flexDirection: 'row',
    marginTop: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.gray,
    fontSize: 14,
  },
});
