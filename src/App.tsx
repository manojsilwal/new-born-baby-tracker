// src/App.tsx
import React from 'react';
import { TrackerProvider, useTracker } from './context/TrackerContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { TodayView } from './components/today/TodayView';
import { HistoryView } from './components/history/HistoryView';
import { HealthView } from './components/health/HealthView';

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

const AppContent: React.FC = () => {
  const { activeTab, activeModal } = useTracker();

  return (
    <div className="min-h-screen bg-warmgray-100 dark:bg-charcoal-900 text-slate-800 dark:text-slate-100 flex flex-col items-center selection:bg-sage-200 dark:selection:bg-sage-800">
      {/* Centered Mobile Shell (Max Width 480px) */}
      <div className="w-full max-w-[480px] min-h-screen bg-warmgray-50 dark:bg-charcoal-850 shadow-sm border-x border-warmgray-200/80 dark:border-charcoal-800/80 flex flex-col relative">
        {/* Compact Header */}
        <Header />

        {/* Main Content Area */}
        <main className="flex-1 px-4 pt-4 overflow-x-hidden">
          {activeTab === 'today' && <TodayView />}
          {activeTab === 'history' && <HistoryView />}
          {activeTab === 'health' && <HealthView />}
        </main>

        {/* Fixed Bottom Navigation inside 480px shell */}
        <BottomNav />

        {/* Global Toast System with Undo */}
        <Toast />

        {/* Modals & Dialogs */}
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
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <TrackerProvider>
      <AppContent />
    </TrackerProvider>
  );
};

export default App;
