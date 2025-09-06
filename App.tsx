import React, { useState } from 'react';
import Header from './components/Header';
import MarketView from './components/MarketView';
import AiAnalysisView from './components/AiAnalysisView';
import { Tab } from './types';
import { fetchNewsWithGemini } from './services/geminiService';
import useLocalStorage from './hooks/useLocalStorage';


const App: React.FC = () => {
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
    if (!apiKey) {
      alert("請先在「AI 新聞分析」頁面設定您的 Google Gemini API 金鑰。");
      setActiveTab(Tab.AI_Analysis); // Switch to AI tab to show settings
      return;
    }

    setAnalysisTarget(stockName);
    setActiveTab(Tab.AI_Analysis);
    setIsFetchingNews(true);
    setAnalysisContent(null);

    try {
      const articleText = await fetchNewsWithGemini(apiKey, stockName, stockCode);
      
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
    <div className="min-h-screen font-sans bg-light-bg dark:bg-dark-bg">
      <Header activeTab={activeTab} setActiveTab={handleTabChange} />
      <main className="p-4 sm:p-6 lg:p-8">
        {activeTab === Tab.Market && <MarketView apiKey={apiKey} onStartAnalysis={handleStartAnalysis} />}
        {activeTab === Tab.AI_Analysis && (
          <AiAnalysisView 
            apiKey={apiKey}
            setApiKey={setApiKey}
            analysisTarget={analysisTarget} 
            isFetchingNews={isFetchingNews}
            initialContent={analysisContent}
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