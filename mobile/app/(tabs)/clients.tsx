import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { fetchClients } from '../../lib/api';
import { colors } from '../../lib/theme';

const STATUS_FILTERS = ['all', 'active', 'prospect', 'lead'] as const;

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function ClientsScreen() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  const filtered = clients
    .filter(c => statusFilter === 'all' || c.status === statusFilter)
    .filter(c => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (c.name || '').toLowerCase().includes(q) ||
             (c.company || '').toLowerCase().includes(q) ||
             (c.email || '').toLowerCase().includes(q);
    });

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

      {/* Status filters */}
      <View style={styles.filters}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, statusFilter === f && styles.filterActive]}
            onPress={() => setStatusFilter(f)}
          >
            <Text style={[styles.filterText, statusFilter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
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
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  filterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    color: colors.gray,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.white,
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
