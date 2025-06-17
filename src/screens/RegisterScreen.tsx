import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';

type RegisterScreenProps = {
  navigation: StackNavigationProp<any>;
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'classTeacher' | 'admin'>('teacher');
  const [group, setGroup] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, isLoading, error, clearError } = useAuth();

  const groups = ['гр. 11-21', 'гр. 9-31', 'гр. 9-32'];

  useEffect(() => {
    // Здесь можно загрузить предметы с сервера
    setSubjects([
      'JavaScript', 'Flutter', 'HTML/CSS', 'Информатика',
  'Русский язык', 'Литература', 'История', 'Введение в ОС',
  'СУБД ', 'ООП на С#', 'Английский язык', 'Физкультура',
  'Основы Java', 'Технологии ИИ', 'Тестирование ПО', '1С Битрикс'
    ]);
  }, []);

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject) 
        : [...prev, subject]
    );
  };

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все обязательные поля');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      Alert.alert('Ошибка', 'Пожалуйста, введите корректный адрес электронной почты');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return;
    }

    if (role === 'classTeacher' && !group) {
      Alert.alert('Ошибка', 'Классный руководитель должен выбрать группу');
      return;
    }

    if (role === 'teacher' && selectedSubjects.length === 0) {
      Alert.alert('Ошибка', 'Преподаватель должен выбрать хотя бы один предмет');
      return;
    }

    setIsSubmitting(true);
    const success = await register(
      username, 
      email,
      password, 
      role, 
      group || undefined,
      role === 'teacher' ? selectedSubjects : undefined
    );
    setIsSubmitting(false);

    if (!success && error) {
      Alert.alert('Ошибка регистрации', error);
      clearError();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Регистрация</Text>
      
      <TextInput
        label="Имя пользователя *"
        value={username}
        onChangeText={setUsername}
        mode="outlined"
        style={styles.input}
      />
      
      <TextInput
        label="Email *"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        mode="outlined"
        style={styles.input}
      />
      
      <TextInput
        label="Пароль *"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        mode="outlined"
        style={styles.input}
      />
      
      <TextInput
        label="Подтвердите пароль *"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        mode="outlined"
        style={styles.input}
      />

      <Text style={styles.label}>Выберите роль *</Text>
      <SegmentedButtons
        value={role}
        onValueChange={(value) => setRole(value as 'teacher' | 'classTeacher' | 'admin')}
        buttons={[
          { value: 'teacher', label: 'Преподаватель' },
          { value: 'classTeacher', label: 'Кл. руководитель' },
          { value: 'admin', label: 'Администратор' }
        ]}
        style={styles.segmentedButtons}
      />
      
      {role === 'classTeacher' && (
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Выберите группу *</Text>
          <View style={styles.picker}>
            <Picker
              selectedValue={group}
              onValueChange={(itemValue) => setGroup(itemValue)}
            >
              <Picker.Item label="Выберите группу..." value="" />
              {groups.map((groupName) => (
                <Picker.Item key={groupName} label={groupName} value={groupName} />
              ))}
            </Picker>
          </View>
        </View>
      )}
      
      {role === 'teacher' && (
        <View style={styles.subjectsContainer}>
          <Text style={styles.label}>Выберите предметы *</Text>
          <View style={styles.subjectsList}>
            {subjects.map(subject => (
              <Button
                key={subject}
                mode={selectedSubjects.includes(subject) ? "contained" : "outlined"}
                onPress={() => handleSubjectToggle(subject)}
                style={styles.subjectButton}
              >
                {subject}
              </Button>
            ))}
          </View>
          {selectedSubjects.length > 0 && (
            <Text style={styles.selectedSubjectsText}>
              Выбрано: {selectedSubjects.join(', ')}
            </Text>
          )}
        </View>
      )}
      
      <Button
        mode="contained"
        onPress={handleRegister}
        loading={isSubmitting || isLoading}
        disabled={isSubmitting || isLoading}
        style={styles.button}
      >
        Зарегистрироваться
      </Button>
      
      <Button
        mode="text"
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        Уже есть аккаунт? Войти
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  segmentedButtons: {
    marginBottom: 15,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#bdbdbd',
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
  },
  subjectsContainer: {
    marginBottom: 15,
  },
  subjectsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  subjectButton: {
    margin: 4,
  },
  selectedSubjectsText: {
    marginTop: 8,
    fontStyle: 'italic',
    color: '#666',
  },
  button: {
    marginTop: 10,
    padding: 5,
  },
  backButton: {
    marginTop: 10,
  },
});

export default RegisterScreen;