import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { Alert, Platform } from 'react-native';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { NotificationsProvider, useNotifications } from '@/contexts/NotificationsContext';
import { useTheme } from '@/hooks/useTheme';

// Import screens
import LoginScreen from './screens/auth/LoginScreen';
import SignupScreen from './screens/auth/SignupScreen';
import DashboardScreen from './screens/DashboardScreen';
import ChatScreen from './screens/ChatScreen';
import ControlScreen from './screens/ControlScreen';
import ProfileScreen from './screens/ProfileScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SettingsScreen from './screens/SettingsScreen';
import { Colors } from '@/constants/theme';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  MainTabs: undefined;
  Notifications: undefined;
  Settings: undefined;
  FieldDetail: { fieldId: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Chat: undefined;
  Control: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Custom tab bar icon component with notification badge
function TabBarIcon({ 
  name, 
  color, 
  size,
  showBadge,
  badgeCount 
}: { 
  name: keyof typeof Feather.glyphMap; 
  color: string; 
  size: number;
  showBadge?: boolean;
  badgeCount?: number;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <Feather name={name} size={size} color={color} />
      {showBadge && (
        <div style={{
          position: 'absolute',
          top: -4,
          right: -4,
          backgroundColor: Colors.light.critical,
          borderRadius: 8,
          minWidth: 16,
          height: 16,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 2,
        }}>
          <span style={{
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 'bold',
          }}>
            {badgeCount && badgeCount > 99 ? '99+' : badgeCount}
          </span>
        </div>
      )}
    </div>
  );
}

function MainTabs() {
  const { theme } = useTheme();
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Feather.glyphMap = 'home';
          let showBadge = false;
          let badgeCount = 0;

          if (route.name === 'Dashboard') {
            iconName = 'home';
            showBadge = unreadCount > 0;
            badgeCount = unreadCount;
          } else if (route.name === 'Chat') {
            iconName = 'message-circle';
          } else if (route.name === 'Control') {
            iconName = 'sliders';
          } else if (route.name === 'Profile') {
            iconName = 'user';
          }

          return (
            <TabBarIcon 
              name={iconName} 
              color={color} 
              size={size}
              showBadge={showBadge}
              badgeCount={badgeCount}
            />
          );
        },
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.backgroundDefault,
          borderTopColor: theme.border,
          height: Platform.OS === 'ios' ? 85 : 60,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ 
          tabBarLabel: 'Home',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ tabBarLabel: 'AI Chat' }}
      />
      <Tab.Screen 
        name="Control" 
        component={ControlScreen}
        options={{ tabBarLabel: 'Control' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialize app
    const init = async () => {
      try {
        // Add any initialization logic here
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate initialization
        setInitialized(true);
      } catch (error) {
        console.error('App initialization error:', error);
        Alert.alert('Initialization Error', 'Failed to initialize app. Please restart.');
        setInitialized(true);
      }
    };

    init();
  }, []);

  if (loading || !initialized) {
    return (
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <div style={{ 
          flex: 1, 
          backgroundColor: '#F8F9FA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: 40,
            height: 40,
            border: `4px solid #2D7A4F`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: 16
          }} />
          <div style={{
            color: '#6B7280',
            fontSize: 16,
            fontWeight: 500
          }}>
            Loading AgriSense...
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </SafeAreaProvider>
    );
  }

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        contentStyle: {
          backgroundColor: '#F8F9FA'
        }
      }}
    >
      {!user ? (
        // Auth screens
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      ) : (
        // Main app with tabs
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen 
            name="Notifications" 
            component={NotificationsScreen}
            options={{ 
              headerShown: true,
              headerTitle: 'Notifications',
              headerBackTitle: 'Back',
              headerStyle: {
                backgroundColor: '#FFFFFF',
              },
              headerTintColor: '#1A1A1A',
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ 
              headerShown: true,
              headerTitle: 'AI Settings',
              headerBackTitle: 'Back',
              headerStyle: {
                backgroundColor: '#FFFFFF',
              },
              headerTintColor: '#1A1A1A',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ChatProvider>
          <NotificationsProvider>
            <NavigationContainer>
              <AppNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </NotificationsProvider>
        </ChatProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}