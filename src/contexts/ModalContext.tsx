import React, { createContext, ReactNode, useContext, useState } from 'react';

interface ModalContextType {
  isAddEventModalVisible: boolean;
  showAddEventModal: () => void;
  hideAddEventModal: () => void;
  isNaturalLanguageDrawerVisible: boolean;
  showNaturalLanguageDrawer: () => void;
  hideNaturalLanguageDrawer: () => void;
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
  const [isNaturalLanguageDrawerVisible, setIsNaturalLanguageDrawerVisible] = useState(false);

  const showAddEventModal = () => setIsAddEventModalVisible(true);
  const hideAddEventModal = () => setIsAddEventModalVisible(false);

  const showNaturalLanguageDrawer = () => setIsNaturalLanguageDrawerVisible(true);
  const hideNaturalLanguageDrawer = () => setIsNaturalLanguageDrawerVisible(false);

  const handleAISchedule = () => {
    // AI 일정 등록 - 자연어 드로어 열기
    showNaturalLanguageDrawer();
  };

  const handleVoiceInput = () => {
    // 음성 입력 - 자연어 드로어를 음성 모드로 열기
    showNaturalLanguageDrawer();
  };

  return (
    <ModalContext.Provider
      value={{
        isAddEventModalVisible,
        showAddEventModal,
        hideAddEventModal,
        isNaturalLanguageDrawerVisible,
        showNaturalLanguageDrawer,
        hideNaturalLanguageDrawer,
        handleAISchedule,
        handleVoiceInput,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};
