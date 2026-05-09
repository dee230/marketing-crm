import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Linking, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { fetchClientDetail, fetchClientInvoices, fetchClientTasks } from '../../lib/api';
import { colors } from '../../lib/theme';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [clientData, invData, taskData] = await Promise.all([
        fetchClientDetail(id as string),
        fetchClientInvoices(id as string),
        fetchClientTasks(id as string),
      ]);
      setClient(clientData);
      setInvoices(invData || []);
      setTasks(taskData || []);
    } catch (err) {
      console.error('Failed to load client detail:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: colors.gray }}>Client not found</Text>
      </View>
    );
  }

  const pendingInvoices = invoices.filter((inv: any) => inv.status !== 'paid');
  const totalOwed = pendingInvoices.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}>
      {/* Client Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {client.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
          </Text>
        </View>
        <Text style={styles.name}>{client.name}</Text>
        {client.company && <Text style={styles.company}>{client.company}</Text>}
        <View style={[styles.statusBadge, { backgroundColor: (client.status === 'active' ? colors.green : colors.teal) + '20' }]}>
          <Text style={[styles.statusText, { color: client.status === 'active' ? colors.green : colors.teal }]}>
            {client.status}
          </Text>
        </View>
      </View>

      {/* Contact Info */}
      {(client.email || client.phone) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          {client.email && (
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${client.email}`)}>
              <Text style={styles.link}>{client.email}</Text>
            </TouchableOpacity>
          )}
          {client.phone && (
            <Text style={styles.text}>{client.phone}</Text>
          )}
        </View>
      )}

      {/* Resources */}
      {(client.website || client.linkedin || client.twitter || client.instagram) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          {client.website && (
            <TouchableOpacity onPress={() => Linking.openURL(client.website)}>
              <Text style={styles.link}>{client.website.replace(/^https?:\/\//, '')}</Text>
            </TouchableOpacity>
          )}
          {client.linkedin && (
            <TouchableOpacity onPress={() => Linking.openURL(client.linkedin)}>
              <Text style={styles.link}>LinkedIn</Text>
            </TouchableOpacity>
          )}
          {client.twitter && (
            <TouchableOpacity onPress={() => Linking.openURL(client.twitter)}>
              <Text style={styles.link}>Twitter/X</Text>
            </TouchableOpacity>
          )}
          {client.instagram && (
            <TouchableOpacity onPress={() => Linking.openURL(client.instagram)}>
              <Text style={styles.link}>Instagram</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{invoices.length}</Text>
          <Text style={styles.statLabel}>Invoices</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>KES {totalOwed.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Outstanding</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{tasks.length}</Text>
          <Text style={styles.statLabel}>Tasks</Text>
        </View>
      </View>

      {/* Invoices */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invoices</Text>
        {invoices.length === 0 ? (
          <Text style={styles.emptyText}>No invoices</Text>
        ) : (
          invoices.map((inv: any) => (
            <View key={inv.id} style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardTitle}>{inv.invoiceNumber || 'Draft'}</Text>
                <Text style={styles.cardAmount}>KES {inv.amount?.toLocaleString()}</Text>
              </View>
              <View style={[styles.miniBadge, { backgroundColor: (inv.status === 'paid' ? colors.green : colors.amber) + '20' }]}>
                <Text style={[styles.miniBadgeText, { color: inv.status === 'paid' ? colors.green : colors.amber }]}>
                  {inv.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Tasks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tasks</Text>
        {tasks.length === 0 ? (
          <Text style={styles.emptyText}>No tasks</Text>
        ) : (
          tasks.map((task: any) => (
            <View key={task.id} style={styles.card}>
              <Text style={styles.cardTitle}>{task.title}</Text>
              {task.description && (
                <Text style={styles.cardDesc} numberOfLines={2}>{task.description}</Text>
              )}
              <View style={[styles.miniBadge, { backgroundColor: (task.status === 'completed' ? colors.green : colors.teal) + '20', alignSelf: 'flex-start', marginTop: 8 }]}>
                <Text style={[styles.miniBadgeText, { color: task.status === 'completed' ? colors.green : colors.teal }]}>
                  {task.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 40 }} />
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
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.dark,
  },
  company: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    color: colors.dark,
    marginBottom: 4,
  },
  link: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
  },
  statLabel: {
    fontSize: 11,
    color: colors.gray,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.dark,
  },
  cardAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.gray,
    marginTop: 4,
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyText: {
    color: colors.gray,
    fontSize: 14,
  },
});
