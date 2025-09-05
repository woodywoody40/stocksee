import React from 'react';
import { Tab } from '../types';

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const ChartBarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const getTabClass = (tab: Tab) =>
    `relative z-10 flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold outline-none transition-colors duration-300 ${
      activeTab === tab
        ? 'text-text-primary'
        : 'text-text-secondary hover:text-text-primary'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-dark-bg/70 backdrop-blur-lg border-b border-dark-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <ChartBarIcon className="w-7 h-7 text-brand-gold" />
            <h1 className="text-2xl font-bold text-text-primary tracking-wider">股見</h1>
            <span className="text-xs text-text-secondary mt-1.5 hidden sm:inline-block">台灣股市洞察</span>
          </div>
          <nav className="relative flex items-center p-1 bg-black/20 rounded-xl w-full sm:w-auto">
             <div
              className="absolute top-1 bottom-1 w-1/2 rounded-lg bg-brand-blue/60 transition-transform duration-300 ease-in-out"
              style={{
                transform: activeTab === Tab.Market ? 'translateX(0%)' : 'translateX(100%)',
              }}
             />
            <button onClick={() => setActiveTab(Tab.Market)} className={getTabClass(Tab.Market)}>
                <ChartBarIcon className="w-5 h-5" />
                市場動態
            </button>
            <button onClick={() => setActiveTab(Tab.AI_Analysis)} className={getTabClass(Tab.AI_Analysis)}>
                <SparklesIcon className="w-5 h-5" />
                AI 新聞分析
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;