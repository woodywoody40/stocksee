import React, { useState } from 'react';
import Header from './components/Header';
import MarketView from './components/MarketView';
import AiAnalysisView from './components/AiAnalysisView';
import { Tab } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Market);

  return (
    <div 
      className="min-h-screen bg-dark-bg font-sans bg-[length:200%_200%] animate-aurora"
      style={{
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 35%), radial-gradient(circle at 90% 80%, rgba(245, 158, 11, 0.15) 0%, transparent 35%), radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.1) 0%, transparent 35%)'
      }}
    >
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="p-4 sm:p-6 lg:p-8">
        {activeTab === Tab.Market && <MarketView />}
        {activeTab === Tab.AI_Analysis && <AiAnalysisView />}
      </main>
       <footer className="text-center p-6 text-xs text-text-secondary border-t border-dark-border mt-8">
        股見 - 台灣股市洞察 © 2024. All data is for informational purposes only.
      </footer>
    </div>
  );
};

export default App;