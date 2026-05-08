import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { fetchInvoices } from '../../lib/api';
import { colors } from '../../lib/theme';

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('unpaid');

  const loadInvoices = async () => {
    try {
      const data = await fetchInvoices();
      setInvoices(data || []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [])
  );

  const filtered = filter === 'all'
    ? invoices
    : invoices.filter(inv =>
        filter === 'paid' ? inv.status === 'paid' : inv.status !== 'paid'
      );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return colors.green;
      case 'sent': return colors.teal;
      case 'draft': return colors.gray;
      case 'overdue': return colors.red;
      default: return colors.amber;
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
      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Total Outstanding</Text>
        <Text style={styles.summaryAmount}>
          KES {invoices
            .filter(inv => inv.status !== 'paid')
            .reduce((sum, inv) => sum + (inv.amount || 0), 0)
            .toLocaleString()
          }
        </Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.filters}>
        {(['unpaid', 'paid', 'all'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'unpaid' ? 'Unpaid' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadInvoices} />}
        renderItem={({ item }) => (
          <View style={styles.invoiceCard}>
            <View style={styles.invoiceHeader}>
              <Text style={styles.invoiceNumber}>{item.invoiceNumber || 'Draft'}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {item.status}
                </Text>
              </View>
            </View>
            {item.description && (
              <Text style={styles.invoiceDesc}>{item.description}</Text>
            )}
            <View style={styles.invoiceFooter}>
              <Text style={styles.amount}>KES {item.amount?.toLocaleString()}</Text>
              <Text style={styles.dueDate}>
                Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '-'}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {filter === 'unpaid' ? 'No unpaid invoices' : 'No invoices found'}
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
  summary: {
    backgroundColor: colors.primary,
    padding: 24,
    margin: 16,
    borderRadius: 16,
  },
  summaryTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 4,
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
    paddingTop: 8,
  },
  invoiceCard: {
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
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.dark,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  invoiceDesc: {
    fontSize: 13,
    color: colors.gray,
    marginTop: 6,
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
  },
  dueDate: {
    fontSize: 12,
    color: colors.gray,
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
