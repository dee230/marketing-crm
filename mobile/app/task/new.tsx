import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createTask, fetchClients } from '../../lib/api';
import { colors } from '../../lib/theme';

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['pending', 'in-progress', 'completed'];

export default function NewTaskScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('pending');
  const [clientId, setClientId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);

  useEffect(() => {
    fetchClients()
      .then(data => setClients(data || []))
      .catch(() => {})
      .finally(() => setLoadingClients(false));
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }
    setSubmitting(true);
    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        clientId: clientId || undefined,
        priority,
        status,
        dueDate: dueDate || undefined,
      });
      Alert.alert('Success', 'Task created!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>New Task</Text>

        {/* Title */}
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="What needs to be done?"
          placeholderTextColor={colors.gray}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Optional details..."
          placeholderTextColor={colors.gray}
          multiline
          numberOfLines={3}
        />

        {/* Priority */}
        <Text style={styles.label}>Priority</Text>
        <View style={styles.optionsRow}>
          {PRIORITIES.map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.optionBtn, priority === p && styles.optionActive]}
              onPress={() => setPriority(p)}
            >
              <Text style={[styles.optionText, priority === p && styles.optionTextActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Status */}
        <Text style={styles.label}>Status</Text>
        <View style={styles.optionsRow}>
          {STATUSES.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.optionBtn, status === s && styles.optionActive]}
              onPress={() => setStatus(s)}
            >
              <Text style={[styles.optionText, status === s && styles.optionTextActive]}>
                {s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Client */}
        <Text style={styles.label}>Client</Text>
        {loadingClients ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clientScroll}>
            <TouchableOpacity
              style={[styles.clientChip, !clientId && styles.clientChipActive]}
              onPress={() => setClientId('')}
            >
              <Text style={[styles.clientChipText, !clientId && styles.clientChipTextActive]}>None</Text>
            </TouchableOpacity>
            {clients.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.clientChip, clientId === c.id && styles.clientChipActive]}
                onPress={() => setClientId(c.id)}
              >
                <Text style={[styles.clientChipText, clientId === c.id && styles.clientChipTextActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Due Date */}
        <Text style={styles.label}>Due Date (optional)</Text>
        <TextInput
          style={styles.input}
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.gray}
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitText}>Create Task</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.dark,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  optionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: colors.gray,
    fontWeight: '500',
  },
  optionTextActive: {
    color: colors.white,
  },
  clientScroll: {
    flexDirection: 'row',
  },
  clientChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    marginRight: 8,
  },
  clientChipActive: {
    backgroundColor: colors.teal + '20',
    borderColor: colors.teal,
  },
  clientChipText: {
    fontSize: 13,
    color: colors.gray,
  },
  clientChipTextActive: {
    color: colors.teal,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  submitText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
