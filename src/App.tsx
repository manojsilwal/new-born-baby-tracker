// src/App.tsx
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TrackerProvider, useTracker } from './context/TrackerContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { TodayView } from './components/today/TodayView';
import { HistoryView } from './components/history/HistoryView';
import { HealthView } from './components/health/HealthView';
import { AuthScreen } from './components/auth/AuthScreen';
import { OnboardingScreen } from './components/auth/OnboardingScreen';
import { BabySelectScreen } from './components/auth/BabySelectScreen';

// Modals
import { FeedModal } from './components/modals/FeedModal';
import { DiaperModal } from './components/modals/DiaperModal';
import { SleepModal } from './components/modals/SleepModal';
import { TemperatureModal } from './components/modals/TemperatureModal';
import { DoctorSummaryModal } from './components/modals/DoctorSummaryModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { BabyProfileModal } from './components/modals/BabyProfileModal';
import { AppointmentModal } from './components/modals/AppointmentModal';
import { GrowthRecordModal } from './components/modals/GrowthRecordModal';
import { HealthNoteModal } from './components/modals/HealthNoteModal';
import { DeleteBabyModal } from './components/modals/DeleteBabyModal';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const {
    activeTab,
    activeModal,
    cloudBootstrap,
    discoveredBabies,
    babyGate,
    adoptDiscoveredBaby,
    startAddNewborn,
    startJoinWithCode,
    showBabyPicker,
  } = useTracker();

  if (loading || (user && cloudBootstrap === 'loading' && babyGate === 'select')) {
    return (
      <div className="min-h-screen bg-warmgray-100 dark:bg-charcoal-900 flex items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {user ? 'Loading your babies…' : 'Loading…'}
        </p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (babyGate === 'select') {
    return (
      <BabySelectScreen
        babies={discoveredBabies}
        onSelect={adoptDiscoveredBaby}
        onAddNewborn={startAddNewborn}
        onJoinWithCode={startJoinWithCode}
      />
    );
  }

  if (babyGate === 'addNewborn') {
    return <OnboardingScreen intent="create" onBack={showBabyPicker} />;
  }

  if (babyGate === 'join') {
    return <OnboardingScreen intent="join" onBack={showBabyPicker} />;
  }

  return (
    <div className="min-h-screen bg-warmgray-100 dark:bg-charcoal-900 text-slate-800 dark:text-slate-100 flex flex-col items-center selection:bg-sage-200 dark:selection:bg-sage-800">
      <div className="w-full max-w-[480px] min-h-screen bg-warmgray-50 dark:bg-charcoal-850 shadow-sm border-x border-warmgray-200/80 dark:border-charcoal-800/80 flex flex-col relative">
        <Header />

        <main className="flex-1 px-4 pt-4 overflow-x-hidden">
          {activeTab === 'today' && <TodayView />}
          {activeTab === 'history' && <HistoryView />}
          {activeTab === 'health' && <HealthView />}
        </main>

        <BottomNav />
        <Toast />

        {activeModal === 'feed' && <FeedModal />}
        {activeModal === 'diaper' && <DiaperModal />}
        {activeModal === 'sleep' && <SleepModal />}
        {activeModal === 'temperature' && <TemperatureModal />}
        {activeModal === 'doctorSummary' && <DoctorSummaryModal />}
        {activeModal === 'settings' && <SettingsModal />}
        {activeModal === 'profile' && <BabyProfileModal />}
        {activeModal === 'appointment' && <AppointmentModal />}
        {activeModal === 'growth' && <GrowthRecordModal />}
        {activeModal === 'healthNote' && <HealthNoteModal />}
        {activeModal === 'deleteBaby' && <DeleteBabyModal />}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <TrackerProvider>
        <AppContent />
      </TrackerProvider>
    </AuthProvider>
  );
};

export default App;
