import React, { useState } from 'react';
import { analyzeNews } from '../services/geminiService';
import { AnalysisResult } from '../types';

const LoadingIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const icons = {
  Positive: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Negative: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-negative" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Neutral: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-neutral" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10H10M14 14H10M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Up: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>,
  Down: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-negative" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>,
  Unchanged: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-neutral" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>,
};


const AiAnalysisView: React.FC = () => {
    const [newsText, setNewsText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!newsText.trim()) {
            setError('請貼上新聞文章內容。');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const analysisResult = await analyzeNews(newsText);
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
            <div className="bg-dark-card p-6 rounded-xl border border-dark-border shadow-2xl">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-gold">AI 新聞分析</h2>
                        <p className="text-text-secondary mt-1">貼上股票相關新聞，讓 AI 為您提煉重點、分析情緒與預測潛在走勢。</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <textarea
                        value={newsText}
                        onChange={(e) => setNewsText(e.target.value)}
                        placeholder="在此貼上新聞文章全文..."
                        className="w-full h-48 p-4 bg-dark-bg border border-dark-border rounded-lg focus:ring-2 focus:ring-brand-blue focus:outline-none transition resize-y"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !newsText.trim()}
                        className="w-full flex justify-center items-center gap-2 bg-dark-border hover:bg-text-tertiary text-text-primary font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-gray-700 disabled:cursor-not-allowed"
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
                        <div className="bg-dark-card p-5 rounded-xl border border-dark-border shadow-lg animate-staggered-fade-in" style={{animationDelay: '100ms'}}>
                            <h4 className="font-semibold text-text-secondary mb-2">重點摘要</h4>
                            <p className="text-text-primary leading-relaxed">{result.summary}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-dark-card p-5 rounded-xl border border-dark-border shadow-lg animate-staggered-fade-in" style={{animationDelay: '200ms'}}>
                                <h4 className="font-semibold text-text-secondary mb-4">情緒分析</h4>
                                <div className="flex items-center gap-4">
                                    {icons[result.sentiment]()}
                                    <span className="text-2xl font-bold text-text-primary">{ {Positive: '正面', Negative: '負面', Neutral: '中性'}[result.sentiment]}</span>
                                </div>
                            </div>
                            <div className="bg-dark-card p-5 rounded-xl border border-dark-border shadow-lg animate-staggered-fade-in" style={{animationDelay: '300ms'}}>
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