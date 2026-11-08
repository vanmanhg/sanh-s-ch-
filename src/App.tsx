import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { MyGardenView } from './components/MyGardenView';
import { PlantIdentifyView } from './components/PlantIdentifyView';
import { DiseaseDiagnosisView } from './components/DiseaseDiagnosisView';
import { ChatbotView } from './components/ChatbotView';
import { WeatherView } from './components/WeatherView';
import { CommunityView } from './components/CommunityView';
import { SeedExchangeView } from './components/SeedExchangeView';
import { MarketView } from './components/MarketView';
import { AgriMapView } from './components/AgriMapView';
import { FinancePriceView } from './components/FinancePriceView';
import { LibraryGuidesView } from './components/LibraryGuidesView';
import { ServicesView } from './components/ServicesView';
import { SmartIrrigationAlertBanner } from './components/SmartIrrigationAlertBanner';
import {
  Flower2,
  ScanLine,
  Stethoscope,
  Bot,
  MapPin,
  Sparkles,
  WifiOff
} from 'lucide-react';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('garden');
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>(undefined);
  const { isOffline, t } = useApp();

  const handleAskChatbotAboutDisease = (prompt?: string) => {
    setChatInitialPrompt(prompt);
    setActiveTab('chatbot');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Tab Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Real-time Soil Moisture & Weather Smart Irrigation Banner */}
      <SmartIrrigationAlertBanner />

      {/* Offline Alert Strip if network disconnected */}
      {isOffline && (
        <div className="bg-amber-500 text-amber-950 px-4 py-1 text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-inner">
          <WifiOff className="w-3.5 h-3.5" />
          <span>{t('offlineMode')}: {t('offlineDesc')}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16 sm:pb-8">
        {activeTab === 'garden' && (
          <MyGardenView
            onGoToIdentify={() => setActiveTab('identify')}
            onNavigateToCommunity={() => setActiveTab('community')}
          />
        )}
        {activeTab === 'identify' && (
          <PlantIdentifyView onAddedToGarden={() => setActiveTab('garden')} />
        )}
        {activeTab === 'diagnosis' && (
          <DiseaseDiagnosisView
            onGoToChatbot={handleAskChatbotAboutDisease}
            onGoToLibrary={() => setActiveTab('library')}
          />
        )}
        {activeTab === 'chatbot' && (
          <ChatbotView initialPrompt={chatInitialPrompt} />
        )}
        {activeTab === 'weather' && (
          <WeatherView />
        )}
        {activeTab === 'community' && (
          <CommunityView />
        )}
        {activeTab === 'seeds' && (
          <SeedExchangeView />
        )}
        {activeTab === 'market' && (
          <MarketView />
        )}
        {activeTab === 'map' && (
          <AgriMapView />
        )}
        {activeTab === 'finance' && (
          <FinancePriceView />
        )}
        {activeTab === 'library' && (
          <LibraryGuidesView onGoToDiagnosis={() => setActiveTab('diagnosis')} />
        )}
        {activeTab === 'services' && (
          <ServicesView />
        )}
      </main>

      {/* Mobile Bottom Quick Navigation Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('garden')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl cursor-pointer ${
            activeTab === 'garden' ? 'text-emerald-600 font-extrabold' : 'text-zinc-500'
          }`}
        >
          <Flower2 className="w-5 h-5" />
          <span className="text-[10px]">Vườn Cây</span>
        </button>

        <button
          onClick={() => setActiveTab('identify')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl cursor-pointer ${
            activeTab === 'identify' ? 'text-emerald-600 font-extrabold' : 'text-zinc-500'
          }`}
        >
          <ScanLine className="w-5 h-5" />
          <span className="text-[10px]">Nhận Diện</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnosis')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl cursor-pointer ${
            activeTab === 'diagnosis' ? 'text-rose-600 font-extrabold' : 'text-zinc-500'
          }`}
        >
          <Stethoscope className="w-5 h-5" />
          <span className="text-[10px]">Bắt Bệnh</span>
        </button>

        <button
          onClick={() => setActiveTab('chatbot')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl cursor-pointer ${
            activeTab === 'chatbot' ? 'text-emerald-600 font-extrabold' : 'text-zinc-500'
          }`}
        >
          <Bot className="w-5 h-5" />
          <span className="text-[10px]">Bác Sĩ AI</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl cursor-pointer ${
            activeTab === 'map' ? 'text-emerald-600 font-extrabold' : 'text-zinc-500'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-[10px]">Bản Đồ</span>
        </button>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
