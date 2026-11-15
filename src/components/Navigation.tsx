import React, { useState } from 'react';
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
  CalendarCheck,
  CalendarClock,
  Camera,
  TrendingUp,
  ChevronDown,
  LayoutGrid
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { t, plants, seedItems, unreadExpertCount } = useApp();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const plantsNeedingWater = plants.filter(p => {
    const last = new Date(p.lastWatered).getTime();
    const diffHours = (Date.now() - last) / (1000 * 3600);
    return diffHours >= p.wateringFrequencyDays * 24;
  });

  const availableSeeds = seedItems.filter(s => s.status === 'available').length;

  const primaryTabs = [
    {
      id: 'garden',
      label: t('navGarden'),
      icon: Flower2,
      badge: plantsNeedingWater.length > 0 ? `${plantsNeedingWater.length}` : null
    },
    {
      id: 'care-planner',
      label: t('navCarePlanner'),
      icon: CalendarClock
    },
    {
      id: 'identify',
      label: t('navIdentify'),
      icon: ScanLine
    },
    {
      id: 'diagnosis',
      label: t('navDiagnosis'),
      icon: Stethoscope
    },
    {
      id: 'weather',
      label: t('navWeather'),
      icon: CloudSun
    },
    {
      id: 'market-prices',
      label: t('navMarketPrices'),
      icon: TrendingUp
    }
  ];

  const moreTabs = [
    { id: 'chatbot', label: t('navChatbot'), icon: Bot },
    { id: 'ar', label: t('navAR'), icon: Camera },
    { id: 'map', label: t('navMap'), icon: Map },
    { id: 'finance', label: t('navFinance'), icon: BadgeDollarSign },
    { id: 'market', label: t('navMarket'), icon: ShoppingBag },
    {
      id: 'seeds',
      label: t('navSeeds'),
      icon: Gift,
      badge: availableSeeds > 0 ? `${availableSeeds}` : null
    },
    { id: 'community', label: t('navCommunity'), icon: Users },
    { id: 'library', label: t('navLibrary'), icon: BookOpen },
    {
      id: 'services',
      label: t('navServices'),
      icon: CalendarCheck,
      badge: unreadExpertCount > 0 ? `${unreadExpertCount}` : null
    }
  ];

  const activeMoreTab = moreTabs.find(tab => tab.id === activeTab);
  const MoreTriggerIcon = activeMoreTab ? activeMoreTab.icon : LayoutGrid;

  return (
    <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar">
          {primaryTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setShowMoreMenu(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full tabular-nums ${
                      isActive ? 'bg-white text-emerald-800' : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Clean Overflow Dropdown for Secondary Tools */}
        <div className="relative shrink-0 py-2">
          <button
            type="button"
            onClick={() => setShowMoreMenu(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer border ${
              activeMoreTab
                ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
            }`}
          >
            <MoreTriggerIcon className="w-4 h-4" />
            <span className="max-w-[120px] truncate">
              {activeMoreTab ? activeMoreTab.label : t('navMoreTools')}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMoreMenu ? 'rotate-180' : ''}`} />
          </button>

          {showMoreMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowMoreMenu(false)}
              />
              <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-1.5 z-40">
                {moreTabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id);
                        setShowMoreMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="truncate">{tab.label}</span>
                      </span>
                      {tab.badge && (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold tabular-nums">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
