
export interface Stock {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  yesterdayPrice: number;
}

export interface AnalysisResult {
  summary: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  prediction: 'Up' | 'Down' | 'Unchanged';
}

export enum Tab {
    Market = 'Market',
    AI_Analysis = 'AI_Analysis'
}

export interface NewsSource {
  title: string;
  uri: string;
}

export interface NewsArticle {
  text: string;
  sources: NewsSource[];
}

export interface HistoricalDataPoint {
  date: string;
  close: number;
}

// FIX: Export the `IndicatorPoint` interface for technical analysis data.
export interface IndicatorPoint {
  date: string;
  value: number;
}
