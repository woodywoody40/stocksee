import React, { useState } from 'react';
import Header from './components/Header';
import MarketView from './components/MarketView';
import AiAnalysisView from './components/AiAnalysisView';
import { Tab } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Market);

  return (
    <div 
      className="min-h-screen bg-dark-bg font-sans"
      style={{
        backgroundImage: 'radial-gradient(circle at top left, rgba(79, 70, 229, 0.08), transparent 30%), radial-gradient(circle at bottom right, rgba(245, 158, 11, 0.08), transparent 30%)'
      }}
    >
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="p-4 sm:p-6 lg:p-8">
        {activeTab === Tab.Market && <MarketView />}
        {activeTab === Tab.AI_Analysis && <AiAnalysisView />}
      </main>
       <footer className="text-center p-4 text-xs text-gray-500 border-t border-dark-border mt-8">
        股見 - 台灣股市洞察 © 2024. All data is for informational purposes only.
      </footer>
    </div>
  );
};

export default App;