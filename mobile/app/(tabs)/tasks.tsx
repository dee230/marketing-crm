import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { fetchTasks, updateTaskStatus } from '../../lib/api';
import { colors } from '../../lib/theme';

export default function TasksScreen() {
  const router = useRouter();
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

  const handleStatusChange = async (task: any) => {
    const nextStatus =
      task.status === 'pending' ? 'in-progress' :
      task.status === 'in-progress' ? 'completed' :
      'pending';
    try {
      await updateTaskStatus(task.id, nextStatus);
      // Optimistically update local state
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update task status');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  const filtered = useMemo(() => {
    let result = filter === 'all' ? [...tasks] : tasks.filter(t => t.status === filter);
    // Sort: uncompleted first, then by due_date ascending (soonest first)
    result.sort((a, b) => {
      const aDone = a.status === 'completed';
      const bDone = b.status === 'completed';
      if (aDone !== bDone) return aDone ? 1 : -1;
      const aDate = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const bDate = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      return aDate - bDate;
    });
    return result;
  }, [tasks, filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.green;
      case 'in-progress': return colors.teal;
      default: return colors.gray;
    }
  };

  const isOverdue = (task: any) => {
    if (task.status === 'completed' || !task.due_date) return false;
    return new Date(task.due_date) < new Date();
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
      {/* Header row with filters + New Task */}
      <View style={styles.filterRow}>
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
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/task/new')}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
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
            {(item.client_name || item.assignee_name) && (
              <View style={styles.taskMeta}>
                {item.client_name && <Text style={styles.metaText}>{item.client_name}</Text>}
                {item.assignee_name && (
                  <Text style={styles.metaText}>
                    {item.client_name ? ' · ' : ''}{item.assignee_name}
                  </Text>
                )}
              </View>
            )}
            {(item.created_by_name || item.updated_by_name) && (
              <View style={[styles.taskMeta, { marginTop: 2 }]}>
                {item.created_by_name && (
                  <Text style={styles.metaMini}>Created by {item.created_by_name}</Text>
                )}
                {item.updated_by_name && item.updated_by_name !== item.created_by_name && (
                  <Text style={styles.metaMini}> · Updated by {item.updated_by_name}</Text>
                )}
              </View>
            )}
            <View style={styles.taskFooter}>
              <TouchableOpacity
                onPress={() => handleStatusChange(item)}
                style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}
              >
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {item.status || 'pending'} ▶
                </Text>
              </TouchableOpacity>
              {item.due_date && (
                <Text style={[styles.dueDate, isOverdue(item) && styles.dueDateOverdue]}>
                  {isOverdue(item) ? '⚠ ' : ''}Due: {new Date(item.due_date).toLocaleDateString()}
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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  filters: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    gap: 8,
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  addBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
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
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: colors.dark,
    fontWeight: '500',
  },
  metaMini: {
    fontSize: 11,
    color: colors.gray,
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
  dueDateOverdue: {
    color: colors.red,
    fontWeight: '600',
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
