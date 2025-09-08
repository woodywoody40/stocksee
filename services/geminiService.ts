

import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, NewsArticle, NewsSource, FinancialDataPoint } from '../types';

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "以繁體中文，對文章內容做出簡潔的重點摘要（2-3句話）。"
    },
    sentiment: {
      type: Type.STRING,
      description: "對股票的整體情緒，必須是 'Positive', 'Negative', 或 'Neutral' 其中之一。"
    },
    prediction: {
      type: Type.STRING,
      description: "根據新聞預測短期股價的潛在走勢，必須是 'Up', 'Down', 或 'Unchanged' 其中之一。"
    }
  },
  required: ["summary", "sentiment", "prediction"],
};


export const analyzeNews = async (apiKey: string, newsText: string): Promise<AnalysisResult> => {
    if (!apiKey) {
        throw new Error("請先在「AI 新聞分析」頁面設定您的 Google Gemini API 金鑰。");
    }
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `你是一位專精於台灣股市的頂尖財經分析師。請僅根據以下提供的新聞文章，以繁體中文進行分析，並嚴格按照指定的 JSON 格式回傳結果。

分析要求：
1.  **summary**: 提煉文章的核心內容，寫成一段約 2-3 句話的重點摘要。
2.  **sentiment**: 判斷這篇新聞對該股票是「正面(Positive)」、「負面(Negative)」還是「中性(Neutral)」。
3.  **prediction**: 根據新聞內容，預測股價可能的短期走勢（上漲(Up)、下跌(Down)或不變(Unchanged)）。

新聞文章如下：
---
${newsText}
---
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: ANALYSIS_SCHEMA,
                temperature: 0.2,
            },
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText) as AnalysisResult;
        return result;

    } catch (error) {
        console.error("Error analyzing news with Gemini API:", error);
        if (error instanceof Error) {
           if (error.message.includes('API key not valid')) {
               throw new Error('您提供的 API 金鑰無效，請檢查後再試。');
           }
           throw new Error(`AI 分析失敗: ${error.message}`);
        }
        throw new Error("AI 分析時發生未知錯誤。");
    }
};

/**
 * Uses the Gemini API to find and return the text of a recent news article for a given stock.
 * @param apiKey The user's Google Gemini API key.
 * @param stockName The name of the stock.
 * @param stockCode The code of the stock.
 * @returns A promise that resolves to an object containing the news text and its sources.
 */
export const fetchNewsWithGemini = async (apiKey: string, stockName: string, stockCode: string): Promise<NewsArticle> => {
    if (!apiKey) {
        throw new Error("請先在「AI 新聞分析」頁面設定您的 Google Gemini API 金鑰。");
    }
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `請使用網路搜尋，尋找關於台灣股票「${stockName} (${stockCode})」的最新財經新聞，並提供一篇約 150-200 字的繁體中文摘要。請確保摘要內容客觀，並僅基於你搜尋到的新聞來源。`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                temperature: 0.1, // Factual but allows for good summarization
            },
        });
        
        const text = response.text.trim();
        
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources: NewsSource[] = groundingChunks
            .map((chunk: any) => ({
                title: chunk.web?.title || '未知來源',
                uri: chunk.web?.uri || '#',
            }))
            .filter((source: NewsSource) => source.uri !== '#');

        const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());

        return { text, sources: uniqueSources };

    } catch (error) {
         console.error("Error fetching news with Gemini API:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error('您提供的 API 金鑰無效或已過期。');
        }
        throw new Error("AI 搜尋新聞時發生錯誤，請稍後再試。");
    }
};

export const getAIFinancialAnalysis = async (apiKey: string, stockName: string, financialData: FinancialDataPoint[]): Promise<string> => {
    if (!apiKey) {
        throw new Error("API 金鑰未設定。");
    }
     if (financialData.length === 0) {
        return "缺乏足夠的財務數據進行分析。";
    }

    const ai = new GoogleGenAI({ apiKey });

    const dataTable = financialData.map(d => 
        `| ${d.quarter.padEnd(6)} | ${d.revenue.toFixed(2).padStart(10)} 億 | ${d.grossMargin.toFixed(2).padStart(8)}% | ${d.operatingMargin.toFixed(2).padStart(10)}% | ${d.netMargin.toFixed(2).padStart(10)}% |`
    ).join('\n');

    const prompt = `你是一位頂尖的台灣股市財務分析師。請僅根據以下提供給「${stockName}」的季度財務數據，以專業但簡潔的語言，用繁體中文提供一個約 3-4 句話的財務狀況總評。

你的分析應專注於：
1.  **營收趨勢**：營收是成長、衰退還是持平？
2.  **獲利能力**：毛利率、營業利益率和稅後淨利率的表現如何？它們是穩定、提升還是下滑？
3.  **整體結論**：綜合來看，公司的財務表現是強勁、穩健、有待改善還是呈現警訊？

**財務數據:**
| 季度     | 營業收入     | 毛利率    | 營業利益率     | 稅後淨利率     |
|----------|--------------|-----------|----------------|----------------|
${dataTable}

請直接提供總評，不要有任何前言或結語。`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.3,
            },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error getting AI financial analysis:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error('您提供的 API 金鑰無效，請檢查後再試。');
        }
        throw new Error("AI 財務分析失敗，請稍後再試。");
    }
};