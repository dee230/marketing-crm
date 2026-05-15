import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { fetchInvoices, markInvoiceAsPaid } from '../../lib/api';
import { colors } from '../../lib/theme';

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('unpaid');
  const [payModal, setPayModal] = useState<{ visible: boolean; invoice: any }>({ visible: false, invoice: null });
  const [paymentRef, setPaymentRef] = useState('');

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

  const handleMarkPaid = async () => {
    if (!payModal.invoice) return;
    try {
      await markInvoiceAsPaid(payModal.invoice.id, paymentRef || undefined);
      setInvoices(prev => prev.map(inv =>
        inv.id === payModal.invoice.id ? { ...inv, status: 'paid', payment_reference: paymentRef || null } : inv
      ));
      setPayModal({ visible: false, invoice: null });
      setPaymentRef('');
      Alert.alert('Done', 'Invoice marked as paid');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update invoice');
    }
  };

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
          <TouchableOpacity
            style={styles.invoiceCard}
            onPress={() => {
              if (item.status !== 'paid') {
                setPayModal({ visible: true, invoice: item });
                setPaymentRef('');
              }
            }}
            disabled={item.status === 'paid'}
          >
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
            {item.client_name && (
              <Text style={styles.clientName}>{item.client_name}</Text>
            )}
            {item.status !== 'paid' && (
              <Text style={styles.tapHint}>Tap to mark as paid</Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {filter === 'unpaid' ? 'No unpaid invoices' : 'No invoices found'}
            </Text>
          </View>
        }
      />

      {/* Mark as Paid Modal */}
      <Modal visible={payModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mark as Paid</Text>
            <Text style={styles.modalInvoice}>
              {payModal.invoice?.invoiceNumber} — KES {payModal.invoice?.amount?.toLocaleString()}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Payment reference (optional)"
              value={paymentRef}
              onChangeText={setPaymentRef}
              placeholderTextColor={colors.gray}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPayModal({ visible: false, invoice: null })}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleMarkPaid}>
                <Text style={styles.confirmText}>Mark Paid</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  summary: {
    backgroundColor: colors.primary,
    padding: 24,
    margin: 16,
    borderRadius: 16,
  },
  summaryTitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  summaryAmount: { fontSize: 28, fontWeight: 'bold', color: colors.white, marginTop: 4 },
  filters: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 13, color: colors.gray, fontWeight: '500' },
  filterTextActive: { color: colors.white },
  list: { padding: 16, paddingTop: 8 },
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
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invoiceNumber: { fontSize: 15, fontWeight: '600', color: colors.dark },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '500' },
  invoiceDesc: { fontSize: 13, color: colors.gray, marginTop: 6 },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  amount: { fontSize: 16, fontWeight: 'bold', color: colors.dark },
  dueDate: { fontSize: 12, color: colors.gray },
  clientName: { fontSize: 12, color: colors.gray, marginTop: 4 },
  tapHint: { fontSize: 11, color: colors.primary, marginTop: 4, fontWeight: '500' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.gray, fontSize: 14 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 32 },
  modalContent: { backgroundColor: colors.white, borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.dark, marginBottom: 8 },
  modalInvoice: { fontSize: 14, color: colors.gray, marginBottom: 16 },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: colors.dark,
    marginBottom: 20,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.lightGray, alignItems: 'center' },
  cancelText: { color: colors.gray, fontSize: 15 },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: colors.green, alignItems: 'center' },
  confirmText: { color: colors.white, fontSize: 15, fontWeight: '600' },
});
