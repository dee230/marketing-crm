import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchClientDetail, updateClient } from '../../../lib/api';
import { colors } from '../../../lib/theme';

const STATUSES = ['active', 'prospect', 'lead'];

export default function EditClientScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('active');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchClientDetail(id as string)
      .then(data => {
        if (data) {
          setName(data.name || '');
          setCompany(data.company || '');
          setEmail(data.email || '');
          setPhone(data.phone || '');
          setStatus(data.status || 'active');
          setWebsite(data.website || '');
          setNotes(data.notes || '');
        }
      })
      .catch(err => Alert.alert('Error', 'Failed to load client'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    setSaving(true);
    try {
      await updateClient(id as string, {
        name: name.trim(),
        company: company.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        status,
        website: website.trim() || null,
        notes: notes.trim() || null,
      });
      Alert.alert('Saved', 'Client updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save');
    } finally {
      setSaving(false);
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Edit Client</Text>

        <Text style={styles.label}>Name *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.gray} />

        <Text style={styles.label}>Company</Text>
        <TextInput style={styles.input} value={company} onChangeText={setCompany} placeholderTextColor={colors.gray} />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={colors.gray} />

        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={colors.gray} />

        <Text style={styles.label}>Status</Text>
        <View style={styles.optionsRow}>
          {STATUSES.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.optionBtn, status === s && styles.optionActive]}
              onPress={() => setStatus(s)}
            >
              <Text style={[styles.optionText, status === s && styles.optionTextActive]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Website</Text>
        <TextInput style={styles.input} value={website} onChangeText={setWebsite} autoCapitalize="none" placeholderTextColor={colors.gray} />

        <Text style={styles.label}>Notes</Text>
        <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} multiline numberOfLines={3} textAlignVertical="top" placeholderTextColor={colors.gray} />

        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.dark, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: colors.dark, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.dark,
  },
  textArea: { minHeight: 80 },
  optionsRow: { flexDirection: 'row', gap: 8 },
  optionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  optionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { fontSize: 14, color: colors.gray, fontWeight: '500' },
  optionTextActive: { color: colors.white },
  saveBtn: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  saveText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
