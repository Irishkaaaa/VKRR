import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import FeedbackListScreen from '../screens/FeedbackListScreen';
import AddFeedbackScreen from '../screens/AddFeedbackScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import StudentDetailScreen from '../screens/StudentDetailScreen';
import { FontAwesome } from '@expo/vector-icons';

// Define the authentication stack parameter list
type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Define the main stack parameter list
type MainStackParamList = {
  MainTabs: undefined;
  StudentDetail: { studentId: string; studentName: string };
  AddFeedback: { studentId?: string; studentName?: string; groupId?: string; groupName?: string; };
};

// Define the tab parameter list
type TabParamList = {
  FeedbackList: undefined;
  Reports: undefined;
  Profile: undefined;
};

// Create the stacks and tabs
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Main tab navigator
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = '';

          if (route.name === 'FeedbackList') {
            iconName = 'list';
          } else if (route.name === 'Reports') {
            iconName = 'bar-chart';
          } else if (route.name === 'Profile') {
            iconName = 'user';
          }

          return <FontAwesome name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="FeedbackList" 
        component={FeedbackListScreen as any} 
        options={{ title: 'Отзывы' }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen} 
        options={{ title: 'Отчеты' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Профиль' }}
      />
    </Tab.Navigator>
  );
};

// Auth navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen name="Login" component={LoginScreen as any} options={{ headerShown: false }} />
      <AuthStack.Screen name="Register" component={RegisterScreen as any} options={{ headerShown: false }} />
    </AuthStack.Navigator>
  );
};

// Main navigator
const MainNavigator = () => {
  return (
    <MainStack.Navigator>
      <MainStack.Screen 
        name="MainTabs" 
        component={MainTabs} 
        options={{ headerShown: false }} 
      />
      <MainStack.Screen 
        name="StudentDetail" 
        component={StudentDetailScreen as any} 
        options={({ route }) => ({ 
          title: route.params.studentName,
        })} 
      />
      <MainStack.Screen 
        name="AddFeedback" 
        component={AddFeedbackScreen as any} 
        options={{ title: 'Добавить отзыв' }} 
      />
    </MainStack.Navigator>
  );
};

// App navigator
const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // Return a loading screen (could use a splash screen component)
    return null;
  }

  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator; 