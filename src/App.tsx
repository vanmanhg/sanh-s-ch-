import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { FirebaseAuthProvider } from './context/FirebaseAuthContext';
import { Plant } from './types';
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
import { MarketPriceView } from './components/MarketPriceView';
import { AgriMapView } from './components/AgriMapView';
import { FinancePriceView } from './components/FinancePriceView';
import { LibraryGuidesView } from './components/LibraryGuidesView';
import { ServicesView } from './components/ServicesView';
import { AutoCarePlannerView } from './components/AutoCarePlannerView';
import { ARGardenOverlayView } from './components/ARGardenOverlayView';
import { SmartIrrigationAlertBanner } from './components/SmartIrrigationAlertBanner';
import { WeatherPestEarlyWarningBanner } from './components/WeatherPestEarlyWarningBanner';
import { AdverseWeatherAlertBanner } from './components/AdverseWeatherAlertBanner';
import {
  Flower2,
  ScanLine,
  Stethoscope,
  Bot,
  MapPin,
  Sparkles,
  WifiOff,
  Camera
} from 'lucide-react';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('garden');
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>(undefined);
  const [arInitialPlantName, setArInitialPlantName] = useState<string | undefined>(undefined);
  const [expertInitialTab, setExpertInitialTab] = useState<'dm' | 'qa' | 'experts' | 'booking'>('dm');
  const [expertPreselectedPlant, setExpertPreselectedPlant] = useState<Plant | null>(null);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState<boolean>(false);
  const { isOffline, t } = useApp();

  React.useEffect(() => {
    const handleQuota = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  const handleAskChatbotAboutDisease = (prompt?: string) => {
    setChatInitialPrompt(prompt);
    setActiveTab('chatbot');
  };

  const handleLaunchAR = (plantName?: string) => {
    setArInitialPlantName(plantName);
    setActiveTab('ar');
  };

  const handleAskExpertForPlant = (plant: Plant) => {
    setExpertPreselectedPlant(plant);
    setExpertInitialTab('dm');
    setActiveTab('services');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Google Maps Platform Quota Banner */}
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 dark:bg-amber-950/80 border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 dark:text-amber-100 hover:text-amber-800 dark:hover:text-white"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Tab Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Real-time Adverse Weather Alert & Push Notification Banner + Direct Toast */}
      <AdverseWeatherAlertBanner onNavigateToWeather={() => setActiveTab('weather')} />

      {/* Real-time Soil Moisture & Weather Smart Irrigation Banner */}
      <SmartIrrigationAlertBanner />

      {/* Early Warning Weather-Based Pest & Disease Push Notification Banner */}
      <WeatherPestEarlyWarningBanner
        onAskChatbot={handleAskChatbotAboutDisease}
        onNavigateToDiagnosis={() => setActiveTab('diagnosis')}
      />

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
            onLaunchAR={handleLaunchAR}
            onAskExpert={handleAskExpertForPlant}
          />
        )}
        {activeTab === 'ar' && (
          <ARGardenOverlayView
            initialPlantName={arInitialPlantName}
            onBackToGarden={() => setActiveTab('garden')}
          />
        )}
        {activeTab === 'care-planner' && (
          <AutoCarePlannerView />
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
          <WeatherView onNavigateToDiagnosis={() => setActiveTab('diagnosis')} />
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
        {activeTab === 'market-prices' && (
          <MarketPriceView />
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
          <ServicesView
            initialSubTab={expertInitialTab}
            preselectedPlant={expertPreselectedPlant}
            onClearPreselectedPlant={() => setExpertPreselectedPlant(null)}
          />
        )}
      </main>

      {/* Mobile Bottom Quick Navigation Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('garden')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl cursor-pointer ${
            activeTab === 'garden' ? 'text-emerald-600 font-extrabold' : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <Flower2 className="w-5 h-5" />
          <span className="text-[10px] truncate max-w-[55px]">{t('navGarden')}</span>
        </button>

        <button
          onClick={() => setActiveTab('identify')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl cursor-pointer ${
            activeTab === 'identify' ? 'text-emerald-600 font-extrabold' : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <ScanLine className="w-5 h-5" />
          <span className="text-[10px] truncate max-w-[55px]">{t('navIdentify')}</span>
        </button>

        <button
          onClick={() => setActiveTab('ar')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl cursor-pointer ${
            activeTab === 'ar' ? 'text-purple-600 font-extrabold' : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <Camera className="w-5 h-5" />
          <span className="text-[10px] truncate max-w-[55px]">{t('navAR')}</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnosis')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl cursor-pointer ${
            activeTab === 'diagnosis' ? 'text-rose-600 font-extrabold' : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <Stethoscope className="w-5 h-5" />
          <span className="text-[10px] truncate max-w-[55px]">{t('navDiagnosis')}</span>
        </button>

        <button
          onClick={() => setActiveTab('chatbot')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl cursor-pointer ${
            activeTab === 'chatbot' ? 'text-emerald-600 font-extrabold' : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <Bot className="w-5 h-5" />
          <span className="text-[10px] truncate max-w-[55px]">{t('navChatbot')}</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl cursor-pointer ${
            activeTab === 'map' ? 'text-emerald-600 font-extrabold' : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-[10px] truncate max-w-[55px]">{t('navMap')}</span>
        </button>
      </div>

      {/* Floating Dr. Green Quick Consultation Button (Visible on desktop/tablet when not in chatbot tab) */}
      {activeTab !== 'chatbot' && (
        <button
          onClick={() => setActiveTab('chatbot')}
          className="hidden sm:flex fixed bottom-6 right-6 z-30 items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white dark:border-zinc-800"
          title="Trò chuyện với Bác Sĩ Cây Trồng AI (Dr. Green)"
        >
          <Bot className="w-5 h-5 animate-pulse" />
          <span>{t('quickHelp')}</span>
        </button>
      )}
    </div>
  );
};

export default function App() {
  return (
    <FirebaseAuthProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </FirebaseAuthProvider>
  );
}
