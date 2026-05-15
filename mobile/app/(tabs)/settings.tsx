import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { clearSession } from '../../lib/api';
import { colors } from '../../lib/theme';

export default function SettingsScreen() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await clearSession();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <Text style={styles.label}>App Version</Text>
          <Text style={styles.value}>1.0.0</Text>
        </View>
        <TouchableOpacity style={styles.card} onPress={handleLogout}>
          <Text style={[styles.label, { color: colors.red }]}>Sign Out</Text>
          <Text style={[styles.value, { color: colors.red }]}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    color: colors.dark,
  },
  value: {
    fontSize: 14,
    color: colors.gray,
  },
});
