import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { colors } from '../../lib/theme';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    dashboard: '📊',
    clients: '👥',
    leads: '⭐',
    tasks: '✓',
    invoices: '📄',
    settings: '⚙',
  };
  return (
    <View style={[styles.iconContainer, focused && styles.iconFocused]}>
      <Text style={[styles.icon, focused && styles.iconFocusedText]}>{icons[name] || '•'}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.dark,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.lightGray,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon name="dashboard" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarLabel: 'Clients',
          tabBarIcon: ({ focused }) => <TabIcon name="clients" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarLabel: 'Tasks',
          tabBarIcon: ({ focused }) => <TabIcon name="tasks" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: 'Leads',
          tabBarLabel: 'Leads',
          tabBarIcon: ({ focused }) => <TabIcon name="leads" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: 'Invoices',
          tabBarLabel: 'Invoices',
          tabBarIcon: ({ focused }) => <TabIcon name="invoices" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  iconFocused: {
    backgroundColor: 'rgba(224, 122, 95, 0.15)',
  },
  icon: {
    fontSize: 16,
  },
  iconFocusedText: {
    // icon stays the same, just the bg changes
  },
});
