import React, { useState } from 'react';
import Header from './components/Header';
import MarketView from './components/MarketView';
import AiAnalysisView from './components/AiAnalysisView';
import { Tab } from './types';
import { fetchFirstNewsArticle } from './services/newsService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Market);
  const [analysisTarget, setAnalysisTarget] = useState<string | null>(null);
  const [analysisContent, setAnalysisContent] = useState<string | null>(null);
  const [isFetchingNews, setIsFetchingNews] = useState(false);

  const handleTabChange = (tab: Tab) => {
    if (tab !== Tab.AI_Analysis) {
      setAnalysisTarget(null);
      setAnalysisContent(null);
    }
    setActiveTab(tab);
  }

  const handleStartAnalysis = async (stockName: string, stockCode: string) => {
    // Switch tab immediately for a better user experience
    setAnalysisTarget(stockName);
    setActiveTab(Tab.AI_Analysis);
    
    // Start fetching news in the background
    setIsFetchingNews(true);
    setAnalysisContent(null); // Clear previous content

    try {
      // Add more specific search terms for better results
      const articleText = await fetchFirstNewsArticle(`"${stockName}" "${stockCode}" 公司 OR 財經 OR 股價`);
      setAnalysisContent(articleText);
    } catch (error) {
      console.error("Failed to fetch and process news:", error);
      const errorMessage = error instanceof Error ? error.message : '未知的錯誤';
      // Pass a special string to the child component to indicate an error
      setAnalysisContent(`//ERROR// ${errorMessage}`);
    } finally {
      setIsFetchingNews(false);
    }
  };


  return (
    <div 
      className="min-h-screen bg-dark-bg font-sans bg-[length:200%_200%] animate-aurora"
      style={{
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 35%), radial-gradient(circle at 90% 80%, rgba(245, 158, 11, 0.15) 0%, transparent 35%), radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.1) 0%, transparent 35%)'
      }}
    >
      <Header activeTab={activeTab} setActiveTab={handleTabChange} />
      <main className="p-4 sm:p-6 lg:p-8">
        {activeTab === Tab.Market && <MarketView onStartAnalysis={handleStartAnalysis} />}
        {activeTab === Tab.AI_Analysis && (
          <AiAnalysisView 
            analysisTarget={analysisTarget} 
            isFetchingNews={isFetchingNews}
            initialContent={analysisContent}
          />
        )}
      </main>
       <footer className="text-center p-6 text-xs text-text-secondary border-t border-dark-border mt-8">
        股見 - 台灣股市洞察 © 2024. All data is for informational purposes only.
      </footer>
    </div>
  );
};

export default App;
