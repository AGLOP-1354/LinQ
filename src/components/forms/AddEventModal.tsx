import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Event {
  id: string;
  title: string;
  time: string;
  location?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  date: string;
}

interface AddEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (event: Omit<Event, 'id'>) => void;
  selectedDate?: string;
}

const AddEventModal: React.FC<AddEventModalProps> = ({
  visible,
  onClose,
  onSave,
  selectedDate,
}) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [date, setDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);

  const resetForm = () => {
    setTitle('');
    setTime('');
    setLocation('');
    setPriority('MEDIUM');
    setDate(selectedDate || new Date().toISOString().split('T')[0]);
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('오류', '일정 제목을 입력해주세요.');
      return;
    }

    if (!time.trim()) {
      Alert.alert('오류', '시간을 입력해주세요.');
      return;
    }

    const newEvent = {
      title: title.trim(),
      time: time.trim(),
      location: location.trim() || undefined,
      priority,
      date,
    };

    onSave(newEvent);
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getPriorityColor = (selectedPriority: string) => {
    switch (selectedPriority) {
      case 'HIGH':
        return '#EF4444';
      case 'MEDIUM':
        return '#F59E0B';
      case 'LOW':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getPriorityLabel = (selectedPriority: string) => {
    switch (selectedPriority) {
      case 'HIGH':
        return '높음';
      case 'MEDIUM':
        return '보통';
      case 'LOW':
        return '낮음';
      default:
        return '보통';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>새 일정 추가</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>저장</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 제목 입력 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>제목 *</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="일정 제목을 입력하세요"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* 날짜 입력 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>날짜</Text>
            <TextInput
              style={styles.textInput}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* 시간 입력 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>시간 *</Text>
            <TextInput
              style={styles.textInput}
              value={time}
              onChangeText={setTime}
              placeholder="예: 09:00, 14:30"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* 장소 입력 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>장소</Text>
            <TextInput
              style={styles.textInput}
              value={location}
              onChangeText={setLocation}
              placeholder="장소를 입력하세요 (선택사항)"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* 중요도 선택 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>중요도</Text>
            <View style={styles.priorityContainer}>
              {(['HIGH', 'MEDIUM', 'LOW'] as const).map((priorityOption) => (
                <TouchableOpacity
                  key={priorityOption}
                  style={[
                    styles.priorityOption,
                    {
                      backgroundColor: priority === priorityOption
                        ? getPriorityColor(priorityOption)
                        : '#F9FAFB',
                      borderColor: priority === priorityOption
                        ? getPriorityColor(priorityOption)
                        : '#E5E7EB',
                    },
                  ]}
                  onPress={() => setPriority(priorityOption)}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      {
                        color: priority === priorityOption ? '#FFFFFF' : '#6B7280',
                      },
                    ]}
                  >
                    {getPriorityLabel(priorityOption)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* AI 제안 섹션 */}
          <View style={styles.aiSuggestionSection}>
            <View style={styles.aiHeader}>
              <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
              <Text style={styles.aiTitle}>AI 제안</Text>
            </View>
            <TouchableOpacity style={styles.aiButton}>
              <Text style={styles.aiButtonText}>자연어로 일정 입력하기</Text>
              <Ionicons name="chevron-forward" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  aiSuggestionSection: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  aiButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default AddEventModal; 