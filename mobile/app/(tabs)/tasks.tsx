import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { fetchTasks } from '../../lib/api';
import { colors } from '../../lib/theme';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');

  const loadTasks = async () => {
    try {
      const data = await fetchTasks();
      setTasks(data || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.green;
      case 'in-progress': return colors.teal;
      default: return colors.gray;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.red;
      case 'medium': return colors.amber;
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
      {/* Filter tabs */}
      <View style={styles.filters}>
        {(['all', 'pending', 'in-progress', 'completed'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'in-progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadTasks} />}
        renderItem={({ item }) => (
          <View style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                  {item.priority || 'medium'}
                </Text>
              </View>
            </View>
            {item.description && (
              <Text style={styles.taskDesc} numberOfLines={2}>{item.description}</Text>
            )}
            <View style={styles.taskFooter}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {item.status || 'pending'}
                </Text>
              </View>
              {item.due_date && (
                <Text style={styles.dueDate}>
                  Due: {new Date(item.due_date).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No tasks found</Text>
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
  filters: {
    flexDirection: 'row',
    padding: 16,
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
  taskCard: {
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
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.dark,
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '500',
  },
  taskDesc: {
    fontSize: 13,
    color: colors.gray,
    marginTop: 6,
    lineHeight: 18,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
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
