import React, { useState } from 'react';
import Header from './components/Header';
import MarketView from './components/MarketView';
import AiAnalysisView from './components/AiAnalysisView';
import { Tab } from './types';
import { fetchNewsWithGemini } from './services/geminiService';
import useLocalStorage from './hooks/useLocalStorage';
import { useTheme } from './hooks/useTheme';


const App: React.FC = () => {
  const [theme] = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Market);
  const [analysisTarget, setAnalysisTarget] = useState<string | null>(null);
  const [analysisContent, setAnalysisContent] = useState<string | null>(null);
  const [isFetchingNews, setIsFetchingNews] = useState(false);
  const [apiKey, setApiKey] = useLocalStorage<string>('gemini-api-key', '');

  const handleTabChange = (tab: Tab) => {
    if (tab !== Tab.AI_Analysis) {
      setAnalysisTarget(null);
      setAnalysisContent(null);
    }
    setActiveTab(tab);
  }

  const handleStartAnalysis = async (stockName: string, stockCode: string) => {
    setAnalysisTarget(stockName);
    setActiveTab(Tab.AI_Analysis);
    setIsFetchingNews(true);
    setAnalysisContent(null);

    if (!apiKey) {
      setAnalysisContent(`//ERROR// 請先在此頁面設定您的 Google Gemini API 金鑰。`);
      setIsFetchingNews(false);
      return;
    }

    try {
      const articleText = await fetchNewsWithGemini(stockName, stockCode, apiKey);
      
      if (articleText.includes('//NO_NEWS_FOUND//')) {
        setAnalysisContent(`//ERROR// AI 找不到關於「${stockName}」的即時新聞。`);
      } else {
        setAnalysisContent(articleText);
      }

    } catch (error) {
      console.error("Failed to fetch news via Gemini:", error);
      const errorMessage = error instanceof Error ? error.message : '未知的錯誤';
      setAnalysisContent(`//ERROR// ${errorMessage}`);
    } finally {
      setIsFetchingNews(false);
    }
  };


  return (
    <div 
      className={`min-h-screen font-sans bg-light-bg dark:bg-dark-bg bg-[length:200%_200%] ${theme === 'dark' ? 'animate-aurora' : ''}`}
      style={theme === 'dark' ? {
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 35%), radial-gradient(circle at 90% 80%, rgba(245, 158, 11, 0.15) 0%, transparent 35%), radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.1) 0%, transparent 35%)'
      } : {}}
    >
      <Header activeTab={activeTab} setActiveTab={handleTabChange} />
      <main className="p-4 sm:p-6 lg:p-8">
        {activeTab === Tab.Market && <MarketView onStartAnalysis={handleStartAnalysis} apiKey={apiKey} />}
        {activeTab === Tab.AI_Analysis && (
          <AiAnalysisView 
            analysisTarget={analysisTarget} 
            isFetchingNews={isFetchingNews}
            initialContent={analysisContent}
            apiKey={apiKey}
            setApiKey={setApiKey}
          />
        )}
      </main>
       <footer className="text-center p-6 text-xs text-text-light-secondary dark:text-text-dark-secondary border-t border-light-border dark:border-dark-border mt-8">
        股見 - 台灣股市洞察 © 2024. All data is for informational purposes only.
      </footer>
    </div>
  );
};

export default App;