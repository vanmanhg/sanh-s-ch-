import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Flower2,
  ScanLine,
  Stethoscope,
  Bot,
  CloudSun,
  Users,
  Gift,
  ShoppingBag,
  Map,
  BadgeDollarSign,
  BookOpen,
  CalendarCheck
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { t, plants, seedItems } = useApp();

  const plantsNeedingWater = plants.filter(p => {
    const last = new Date(p.lastWatered).getTime();
    const diffHours = (Date.now() - last) / (1000 * 3600);
    return diffHours >= p.wateringFrequencyDays * 24;
  });

  const availableSeeds = seedItems.filter(s => s.status === 'available').length;

  const tabs = [
    {
      id: 'garden',
      label: t('navGarden'),
      icon: Flower2,
      badge: plantsNeedingWater.length > 0 ? `${plantsNeedingWater.length}` : null,
      badgeColor: 'bg-sky-500 text-white'
    },
    {
      id: 'identify',
      label: t('navIdentify'),
      icon: ScanLine,
      isAi: true
    },
    {
      id: 'diagnosis',
      label: t('navDiagnosis'),
      icon: Stethoscope,
      isAi: true
    },
    {
      id: 'chatbot',
      label: t('navChatbot'),
      icon: Bot,
      isAi: true
    },
    {
      id: 'weather',
      label: t('navWeather'),
      icon: CloudSun
    },
    {
      id: 'community',
      label: t('navCommunity'),
      icon: Users
    },
    {
      id: 'seeds',
      label: t('navSeeds'),
      icon: Gift,
      badge: availableSeeds > 0 ? `${availableSeeds}` : null,
      badgeColor: 'bg-emerald-500 text-white'
    },
    {
      id: 'market',
      label: t('navMarket'),
      icon: ShoppingBag
    },
    {
      id: 'map',
      label: t('navMap'),
      icon: Map
    },
    {
      id: 'finance',
      label: t('navFinance'),
      icon: BadgeDollarSign
    },
    {
      id: 'library',
      label: t('navLibrary'),
      icon: BookOpen
    },
    {
      id: 'services',
      label: t('navServices'),
      icon: CalendarCheck
    }
  ];

  return (
    <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center space-x-1 overflow-x-auto py-2 no-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-bold'
                    : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'}`} />
                <span>{tab.label}</span>

                {tab.isAi && !isActive && (
                  <span className="text-[9px] px-1 py-0.2 rounded font-bold uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    AI
                  </span>
                )}

                {tab.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 text-[10px] font-extrabold rounded-full ${
                      isActive ? 'bg-white text-emerald-800' : tab.badgeColor
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
