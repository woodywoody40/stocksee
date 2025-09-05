import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from '../types';

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
};


export const analyzeNews = async (newsText: string, apiKey: string): Promise<AnalysisResult> => {
    if (!apiKey) {
        throw new Error("請在上方欄位輸入您的 Google Gemini API 金鑰。");
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
 * Generates a real-time AI insight summary for a specific stock.
 * @param stockName - The name of the stock.
 * @param stockCode - The code of the stock.
 * @param apiKey - The user's Google Gemini API key.
 * @returns A promise that resolves to a string containing the AI-generated insight.
 */
export const getAIStockInsight = async (stockName: string, stockCode: string, apiKey: string): Promise<string> => {
    if (!apiKey) {
        throw new Error("API 金鑰未提供。");
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `你是一位頂尖的台灣股市分析師。請針對股票「${stockName} (${stockCode})」，提供一份簡潔、中立、專業的即時市場洞察。
    
    內容需包含：
    1.  **近期概況**: 總結最近影響該股票的關鍵新聞或市場情緒（約 2-3 句話）。
    2.  **潛在動能**: 根據近期事件，點出一個主要的潛在利多或利空因素。
    
    請以專業、客觀的語氣，用繁體中文回覆，總長度控制在 150 字以內。`;

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
        console.error("Error getting stock insight with Gemini API:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error('您的 API 金鑰無效或已過期。');
        }
        throw new Error("無法生成 AI 洞察，請稍後再試。");
    }
};
