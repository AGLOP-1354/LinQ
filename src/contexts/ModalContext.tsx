import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  isAddEventModalVisible: boolean;
  showAddEventModal: () => void;
  hideAddEventModal: () => void;
  handleAISchedule: () => void;
  handleVoiceInput: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isAddEventModalVisible, setIsAddEventModalVisible] = useState(false);

  const showAddEventModal = () => setIsAddEventModalVisible(true);
  const hideAddEventModal = () => setIsAddEventModalVisible(false);

  const handleAISchedule = () => {
    // TODO: AI 일정 등록 모달 또는 AI 채팅 화면으로 이동
    console.log('AI 일정 등록');
  };

  const handleVoiceInput = () => {
    // TODO: 음성 입력 모달 표시
    console.log('음성 입력');
  };

  return (
    <ModalContext.Provider
      value={{
        isAddEventModalVisible,
        showAddEventModal,
        hideAddEventModal,
        handleAISchedule,
        handleVoiceInput,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};
