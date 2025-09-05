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
  required: ["summary", "sentiment", "prediction"]
};


export const analyzeNews = async (newsText: string, apiKey: string): Promise<AnalysisResult> => {
    if (!apiKey) {
        throw new Error("Google Gemini API Key 尚未提供。");
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
               throw new Error('提供的 API Key 無效或已過期，請檢查後再試。');
           }
           throw new Error(`AI 分析失敗: ${error.message}`);
        }
        throw new Error("AI 分析時發生未知錯誤。");
    }
};