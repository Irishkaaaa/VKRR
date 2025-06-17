import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Keyboard } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';

type LoginScreenProps = {
  navigation: StackNavigationProp<any>;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const { signIn, isLoading, error, clearError } = useAuth();

  const handleLogin = async () => {
    Keyboard.dismiss(); // Скрываем клавиатуру при отправке
    
    if (!username.trim() || !password.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await signIn(username, password);
      if (!success && error) {
        Alert.alert('Ошибка входа', error || 'Неверные учетные данные');
      }
    } catch (err) {
      Alert.alert('Ошибка', 'Произошла непредвиденная ошибка');
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (error) {
      Alert.alert('Ошибка', error);
      clearError();
    }
  }, [error]);

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Вход в систему
      </Text>
      
      <TextInput
  label="Имя пользователя"
  value={username}
  onChangeText={setUsername}
  mode="outlined"
  style={[
    styles.input,
    { 
      paddingLeft: 30, // Отступ слева для иконки
      backgroundColor: '#fff' 
    }
  ]}
  autoCapitalize="none"
  autoCorrect={false}
  left={
    <TextInput.Icon 
      icon="account" 
      style={{ marginRight: 5 }} // Дополнительный отступ для иконки
    />
  }
/>
      
      <TextInput
  label="Пароль"
  value={password}
  onChangeText={setPassword}
  secureTextEntry={secureTextEntry}
  mode="outlined"
  style={[
    styles.input,
    { 
      paddingLeft: 30,    // Отступ слева для иконки замка
    }
  ]}
  left={
    <TextInput.Icon 
      icon="lock" 
      style={{ marginRight: 5 }}  // Доп. отступ после иконки
    />
  }
  right={
    <TextInput.Icon 
      icon={secureTextEntry ? "eye-off" : "eye"} 
      onPress={() => setSecureTextEntry(!secureTextEntry)}
      style={{ marginLeft: 10 }}  // Доп. отступ перед иконкой
    />
  }
/>
      
      {isSubmitting || isLoading ? (
        <ActivityIndicator animating={true} style={styles.loader} />
      ) : (
        <Button
          mode="contained"
          onPress={handleLogin}
          disabled={isSubmitting || isLoading}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Войти
        </Button>
      )}
      
      <View style={styles.footer}>
        <Text variant="bodyMedium">Нет аккаунта?</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Register')}
          disabled={isSubmitting}
        >
          <Text style={styles.registerLink}>Зарегистрироваться</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 32,
    textAlign: 'center',
    color: '#6200ee',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 24,
    borderRadius: 8,
    elevation: 2,
  },
  buttonContent: {
    height: 48,
  },
  loader: {
    marginTop: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 4,
  },
  registerLink: {
    color: '#6200ee',
    fontWeight: 'bold',
  },
});

export default LoginScreen;