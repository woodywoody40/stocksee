import React, { useState } from 'react';
import { analyzeNews } from '../services/geminiService';
import { AnalysisResult } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';

const LoadingIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const InformationCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
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


const AiAnalysisView: React.FC = () => {
    const [newsText, setNewsText] = useState('');
    const [apiKey, setApiKey] = useLocalStorage<string>('gemini-api-key', '');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!newsText.trim() || !apiKey.trim()) {
            setError('請貼上新聞文章內容並輸入您的 API 金鑰。');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const analysisResult = await analyzeNews(newsText, apiKey);
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
    };
    
    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-dark-card backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-dark-border shadow-2xl">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-gold">AI 新聞分析</h2>
                        <p className="text-text-secondary mt-1">貼上股票相關新聞，讓 AI 為您提煉重點、分析情緒與預測潛在走勢。</p>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <label htmlFor="api-key-input" className="block text-sm font-medium text-text-secondary">
                                Google Gemini API 金鑰
                            </label>
                            <div className="relative group flex items-center">
                                <InformationCircleIcon className="w-4 h-4 text-text-tertiary cursor-help" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-dark-card/95 backdrop-blur-xl border border-dark-border rounded-lg text-xs text-text-secondary shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 transform">
                                    <p className="font-semibold text-text-primary mb-1">什麼是 API 金鑰？</p>
                                    <p>API 金鑰是您用來存取 Google AI 服務的專屬密碼。本應用需要它來驅動 AI 分析功能。</p>
                                    <p className="mt-2">您的金鑰將安全地儲存在瀏覽器中，不會上傳至任何伺服器。</p>
                                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-blue/90 hover:underline mt-2 block font-semibold">
                                        點此免費取得金鑰 &rarr;
                                    </a>
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-[-4px] w-2 h-2 bg-dark-card border-r border-b border-dark-border transform rotate-45"></div>
                                </div>
                            </div>
                        </div>
                        <input
                            id="api-key-input"
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="在此輸入您的 API 金鑰"
                            className="w-full p-3 bg-black/30 border border-dark-border rounded-lg focus:ring-2 focus:ring-brand-blue/80 focus:outline-none transition"
                            disabled={isLoading}
                        />
                    </div>
                    <textarea
                        value={newsText}
                        onChange={(e) => setNewsText(e.target.value)}
                        placeholder="在此貼上新聞文章全文..."
                        className="w-full h-48 p-4 bg-black/30 border border-dark-border rounded-lg focus:ring-2 focus:ring-brand-blue/80 focus:outline-none transition resize-y"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !newsText.trim() || !apiKey.trim()}
                        className="w-full flex justify-center items-center gap-2 bg-brand-blue hover:bg-brand-blue/80 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-text-tertiary disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100"
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
                        <div className="bg-dark-card backdrop-blur-md p-5 rounded-xl border border-dark-border shadow-lg animate-staggered-fade-in" style={{animationDelay: '100ms'}}>
                            <h4 className="font-semibold text-text-secondary mb-2">重點摘要</h4>
                            <p className="text-text-primary leading-relaxed">{result.summary}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-dark-card backdrop-blur-md p-5 rounded-xl border border-dark-border shadow-lg animate-staggered-fade-in" style={{animationDelay: '200ms'}}>
                                <h4 className="font-semibold text-text-secondary mb-4">情緒分析</h4>
                                <div className="flex items-center gap-4">
                                    {icons[result.sentiment]()}
                                    <span className="text-2xl font-bold text-text-primary">{ {Positive: '正面', Negative: '負面', Neutral: '中性'}[result.sentiment]}</span>
                                </div>
                            </div>
                            <div className="bg-dark-card backdrop-blur-md p-5 rounded-xl border border-dark-border shadow-lg animate-staggered-fade-in" style={{animationDelay: '300ms'}}>
                                <h4 className="font-semibold text-text-secondary mb-4">潛在波動預測</h4>
                                <div className="flex items-center gap-4">
                                    {icons[result.prediction]()}
                                    <span className="text-2xl font-bold text-text-primary">{ {Up: '上漲', Down: '下跌', Unchanged: '不變'}[result.prediction]}</span>
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