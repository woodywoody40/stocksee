import React, { useState, useEffect, useCallback, useRef } from 'react';
import { analyzeNews } from '../services/geminiService';
import { AnalysisResult } from '../types';

const LoadingIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const icons = {
  Positive: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Negative: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-negative" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Neutral: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-neutral" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14 10H10M14 14H10M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Up: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>,
  Down: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-negative" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>,
  Unchanged: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-neutral" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" /></svg>,
};

interface AiAnalysisViewProps {
    analysisTarget: string | null;
    isFetchingNews: boolean;
    initialContent: string | null;
}

const AiAnalysisView: React.FC<AiAnalysisViewProps> = ({ analysisTarget, isFetchingNews, initialContent }) => {
    const [newsText, setNewsText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const analysisTriggeredForContent = useRef<string | null>(null);

    const handleAnalyze = useCallback(async (contentToAnalyze?: string) => {
        const text = contentToAnalyze || newsText;
        if (!text.trim()) {
            setError('請先貼上或等待新聞內容載入。');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const analysisResult = await analyzeNews(text);
            setResult(analysisResult);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('發生未知錯誤。');
            }
        } finally {
            setIsLoading(false);
        }
    }, [newsText]);

    useEffect(() => {
        setResult(null);
        setNewsText('');
        setError(null);
        analysisTriggeredForContent.current = null;
    }, [analysisTarget]);

    useEffect(() => {
        if (initialContent && initialContent !== analysisTriggeredForContent.current) {
            analysisTriggeredForContent.current = initialContent; // Mark as processed
            
            if (initialContent.startsWith('//ERROR//')) {
                setError(`自動獲取新聞失敗: ${initialContent.replace('//ERROR// ', '')}`);
                setNewsText(''); // Clear text area on error
            } else {
                setNewsText(initialContent);
                handleAnalyze(initialContent);
            }
        }
    }, [initialContent, handleAnalyze]);

    if (isFetchingNews) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-light-card dark:bg-dark-card backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-light-border dark:border-dark-border shadow-2xl flex flex-col items-center justify-center space-y-4 min-h-[400px]">
                     <LoadingIcon className="h-8 w-8 text-brand-gold"/>
                     <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">AI 正在為您搜尋「{analysisTarget}」的最新新聞...</h3>
                     <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">請稍候，過程可能需要一點時間。</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-light-card dark:bg-dark-card backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-light-border dark:border-dark-border shadow-lg dark:shadow-2xl">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-gold">AI 新聞分析</h2>
                        <p className="text-text-light-secondary dark:text-text-dark-secondary mt-1">
                          {analysisTarget 
                            ? `已自動帶入關於「${analysisTarget}」的最新聞，您也可手動修改內容。`
                            : "從「市場動態」選擇股票，或在此貼上新聞，讓 AI 為您提煉重點。"
                          }
                        </p>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <textarea
                        value={newsText}
                        onChange={(e) => setNewsText(e.target.value)}
                        placeholder={
                          analysisTarget
                            ? `在此貼上或編輯關於「${analysisTarget}」的新聞文章全文...`
                            : "在此貼上新聞文章全文..."
                        }
                        className="w-full h-48 p-4 bg-slate-100 dark:bg-black/30 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-brand-blue/80 focus:outline-none transition resize-y"
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => handleAnalyze()}
                        disabled={isLoading || !newsText.trim()}
                        className="w-full flex justify-center items-center gap-2 bg-brand-blue hover:bg-brand-blue/80 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-text-light-tertiary dark:disabled:bg-text-dark-tertiary disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100"
                    >
                        {isLoading ? <><LoadingIcon /> 分析中...</> : '開始分析'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="mt-6 bg-negative/20 border border-negative/50 text-negative p-4 rounded-lg animate-fade-in">
                    <h3 className="font-bold">分析失敗</h3>
                    <p>{error}</p>
                </div>
            )}

            {result && (
                <div className="mt-8">
                     <h3 className="text-xl font-bold mb-4 text-brand-gold pl-3 border-l-4 border-brand-gold">分析結果</h3>
                    <div className="space-y-6">
                        <div className="bg-light-card dark:bg-dark-card backdrop-blur-md p-5 rounded-xl border border-light-border dark:border-dark-border shadow-lg animate-staggered-fade-in" style={{animationDelay: '100ms'}}>
                            <h4 className="font-semibold text-text-light-secondary dark:text-text-dark-secondary mb-2">重點摘要</h4>
                            <p className="text-text-light-primary dark:text-text-dark-primary leading-relaxed">{result.summary}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-light-card dark:bg-dark-card backdrop-blur-md p-5 rounded-xl border border-light-border dark:border-dark-border shadow-lg animate-staggered-fade-in" style={{animationDelay: '200ms'}}>
                                <h4 className="font-semibold text-text-light-secondary dark:text-text-dark-secondary mb-4">情緒分析</h4>
                                <div className="flex items-center gap-4">
                                    {icons[result.sentiment]()}
                                    <span className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">{ {Positive: '正面', Negative: '負面', Neutral: '中性'}[result.sentiment]}</span>
                                </div>
                            </div>
                            <div className="bg-light-card dark:bg-dark-card backdrop-blur-md p-5 rounded-xl border border-light-border dark:border-dark-border shadow-lg animate-staggered-fade-in" style={{animationDelay: '300ms'}}>
                                <h4 className="font-semibold text-text-light-secondary dark:text-text-dark-secondary mb-4">潛在波動預測</h4>
                                <div className="flex items-center gap-4">
                                    {icons[result.prediction]()}
                                    <span className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">{ {Up: '上漲', Down: '下跌', Unchanged: '不變'}[result.prediction]}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiAnalysisView;