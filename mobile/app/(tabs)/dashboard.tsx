import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { fetchDashboardStats, clearSession, fetchInvoices, fetchTasks } from '../../lib/api';
import { colors } from '../../lib/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    clients: [] as any[],
    tasks: [] as any[],
    invoices: [] as any[],
  });

  const loadData = async () => {
    try {
      const [dashboardData, invoices, tasks] = await Promise.all([
        fetchDashboardStats(),
        fetchInvoices(),
        fetchTasks(),
      ]);
      setStats({
        clients: dashboardData.clients || [],
        tasks: tasks || [],
        invoices: invoices || [],
      });
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = async () => {
    await clearSession();
    router.replace('/');
  };

  const pendingInvoices = stats.invoices.filter((inv: any) => inv.status !== 'paid');
  const totalPending = pendingInvoices.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
  const activeTasks = stats.tasks.filter((t: any) => t.status !== 'completed');

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: colors.primary }]}>
          <Text style={styles.statNumber}>{stats.clients.length}</Text>
          <Text style={styles.statLabel}>Clients</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.teal }]}>
          <Text style={styles.statNumber}>{activeTasks.length}</Text>
          <Text style={styles.statLabel}>Active Tasks</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: colors.amber }]}>
          <Text style={styles.statNumber}>{pendingInvoices.length}</Text>
          <Text style={styles.statLabel}>Pending Invoices</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.green }]}>
          <Text style={styles.statNumber}>KES {totalPending.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Owed</Text>
        </View>
      </View>

      {/* Recent Invoices */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Invoices</Text>
        {pendingInvoices.length === 0 ? (
          <Text style={styles.emptyText}>No pending invoices</Text>
        ) : (
          pendingInvoices.slice(0, 5).map((inv: any) => (
            <View key={inv.id} style={styles.listItem}>
              <View>
                <Text style={styles.itemTitle}>{inv.invoiceNumber || `Invoice`}</Text>
                <Text style={styles.itemSub}>{inv.description || ''}</Text>
              </View>
              <Text style={styles.amount}>KES {inv.amount?.toLocaleString()}</Text>
            </View>
          ))
        )}
      </View>

      {/* Recent Tasks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Tasks</Text>
        {activeTasks.length === 0 ? (
          <Text style={styles.emptyText}>No active tasks</Text>
        ) : (
          activeTasks.slice(0, 5).map((task: any) => (
            <View key={task.id} style={styles.listItem}>
              <Text style={styles.itemTitle}>{task.title}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: task.status === 'in-progress' ? 'rgba(0, 196, 204, 0.15)' : 'rgba(155, 155, 143, 0.15)' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: task.status === 'in-progress' ? colors.teal : colors.gray }
                ]}>
                  {task.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.dark,
  },
  logoutBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.red,
  },
  logoutText: {
    color: colors.red,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.dark,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 12,
  },
  emptyText: {
    color: colors.gray,
    fontSize: 14,
    paddingVertical: 8,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.dark,
  },
  itemSub: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
