
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, NewsArticle, NewsSource } from '../types';

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

    const prompt = `你是一位頂尖的財經新聞專家，專精於台灣股市的即時動態。你的任務是使用網路搜尋能力，為台灣股票「${stockName} (${stockCode})」找出**今天（過去 24 小時內）最重要的一篇**財經新聞。

你的回覆必須**只包含該新聞報導的「完整內文」或「詳盡摘要」**，必須客觀、中立，並且不包含任何前言、標題或個人評論。

**重要**: 一家活躍的上市公司必定會有近期的相關新聞。如果第一時間找不到，請擴大搜尋範圍至各大財經新聞網站（例如：鉅亨網、經濟日報、工商時報），務必回傳一篇最相關的新聞內容。絕不可回覆找不到新聞。`;

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


/**
 * Generates a real-time AI insight summary for a specific stock.
 * @param apiKey The user's Google Gemini API key.
 * @param stockName - The name of the stock.
 * @param stockCode - The code of the stock.
 * @returns A promise that resolves to a string containing the AI-generated insight.
 */
export const getAIStockInsight = async (apiKey: string, stockName: string, stockCode: string): Promise<string> => {
    if (!apiKey) {
        throw new Error("請先在「AI 新聞分析」頁面設定您的 Google Gemini API 金鑰。");
    }
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `你是一位頂尖的台灣股市分析師。請使用你的網路搜尋能力，針對股票「${stockName} (${stockCode})」，提供一份簡潔、中立、專業的即時市場洞察。
    
    內容需包含：
    1.  **近期概況**: 根據最新的新聞和市場數據，總結最近影響該股票的關鍵事件或市場情緒（約 2-3 句話）。
    2.  **潛在動能**: 根據近期事件，點出一個主要的潛在利多或利空因素。
    
    請以專業、客觀的語氣，用繁體中文回覆，總長度控制在 150 字以內。`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                temperature: 0.3,
            },
        });
        
        return response.text.trim();
    } catch (error) {
        console.error("Error getting stock insight with Gemini API:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error('您提供的 API 金鑰無效或已過期。');
        }
        throw new Error("無法生成 AI 洞察，請稍後再試。");
    }
};