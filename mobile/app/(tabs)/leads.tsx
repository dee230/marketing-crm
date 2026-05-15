import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { fetchLeads, updateLeadStatus } from '../../lib/api';
import { colors } from '../../lib/theme';

const STATUSES = ['all', 'new', 'contacted', 'qualified', 'converted', 'lost'] as const;
const SOURCE_COLORS: Record<string, string> = {
  website: colors.teal,
  referral: colors.green,
  linkedin: '#0A66C2',
  facebook: '#1877F2',
  email: colors.primary,
  other: colors.gray,
};

export default function LeadsScreen() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const loadLeads = async () => {
    try {
      const data = await fetchLeads();
      setLeads(data || []);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLeads();
    }, [])
  );

  const filtered = useMemo(() => {
    let result = filter === 'all' ? leads : leads.filter(l => l.status === filter);
    // Sort: newest first
    result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    return result;
  }, [leads, filter]);

  const handleStatusChange = (lead: any) => {
    const currentIdx = STATUSES.filter(s => s !== 'all').indexOf(lead.status);
    const nextStatus = STATUSES.filter(s => s !== 'all')[
      currentIdx >= STATUSES.filter(s => s !== 'all').length - 1 ? 0 : currentIdx + 1
    ];
    Alert.alert(
      'Change Status',
      `Move "${lead.name}" to "${nextStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: async () => {
            try {
              const result = await updateLeadStatus(lead.id, nextStatus);
              if (result.convertedToClient) {
                Alert.alert('Converted!', 'Lead has been converted to a client.');
              }
              setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: nextStatus, client_id: result.clientId || l.client_id } : l));
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to update lead');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return colors.teal;
      case 'contacted': return colors.amber;
      case 'qualified': return colors.primary;
      case 'converted': return colors.green;
      case 'lost': return colors.red;
      default: return colors.gray;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Status filters */}
      <View style={styles.filters}>
        {STATUSES.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadLeads} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.leadCard} onPress={() => handleStatusChange(item)}>
            <View style={styles.leadHeader}>
              <Text style={styles.leadName}>{item.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {item.status}
                </Text>
              </View>
            </View>
            {(item.company || item.email) && (
              <Text style={styles.leadMeta}>{item.company || item.email}</Text>
            )}
            <View style={styles.leadFooter}>
              <Text style={styles.sourceLabel}>{item.source || 'other'}</Text>
              {item.client_name && (
                <Text style={styles.clientLabel}>→ {item.client_name}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No leads found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  filters: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    gap: 6,
    flexWrap: 'wrap',
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 12, color: colors.gray, fontWeight: '500' },
  filterTextActive: { color: colors.white },
  list: { padding: 16, paddingTop: 8 },
  leadCard: {
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
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leadName: { fontSize: 15, fontWeight: '600', color: colors.dark, flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '500' },
  leadMeta: { fontSize: 13, color: colors.gray, marginTop: 4 },
  leadFooter: { flexDirection: 'row', marginTop: 8, gap: 8 },
  sourceLabel: { fontSize: 11, color: colors.gray, backgroundColor: colors.lightGray + '80', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  clientLabel: { fontSize: 11, color: colors.green, fontWeight: '500' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.gray, fontSize: 14 },
});
