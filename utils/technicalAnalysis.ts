
import { HistoricalDataPoint, IndicatorPoint, MACDPoint } from '../types';

/**
 * Calculates the Simple Moving Average (SMA). Returns an array of the same length as input data,
 * with nulls for periods where the MA isn't calculable.
 * @param data - Array of historical data points, sorted oldest to newest.
 * @param period - The number of days for the moving average window.
 * @returns An array of indicator points (or nulls).
 */
export const calculateMA = (data: HistoricalDataPoint[], period: number): IndicatorPoint[] => {
    const result: IndicatorPoint[] = new Array(data.length).fill(null).map((_, i) => ({ date: data[i].date, value: null }));
    if (data.length < period) return result;

    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += data[i].close;
    }
    result[period - 1] = { date: data[period - 1].date, value: sum / period };

    for (let i = period; i < data.length; i++) {
        sum = sum - data[i - period].close + data[i].close;
        result[i] = { date: data[i].date, value: sum / period };
    }
    return result;
};

/**
 * Calculates the Exponential Moving Average (EMA).
 * @param data - Array of closing prices.
 * @param period - The smoothing period.
 * @returns An array of EMA values.
 */
const calculateEMA = (data: number[], period: number): (number | null)[] => {
    const result: (number | null)[] = new Array(data.length).fill(null);
    if (data.length < period) return result;

    const multiplier = 2 / (period + 1);
    let sma = data.slice(0, period).reduce((a, b) => a + b) / period;
    result[period - 1] = sma;

    for (let i = period; i < data.length; i++) {
        result[i] = (data[i] - (result[i - 1] as number)) * multiplier + (result[i - 1] as number);
    }
    return result;
};

/**
 * Calculates the Moving Average Convergence Divergence (MACD).
 * @param data - Array of historical data points, sorted oldest to newest.
 * @returns An array of MACD points.
 */
export const calculateMACD = (data: HistoricalDataPoint[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): MACDPoint[] => {
    if (data.length < slowPeriod) return [];
    const closes = data.map(d => d.close);

    const emaFast = calculateEMA(closes, fastPeriod);
    const emaSlow = calculateEMA(closes, slowPeriod);
    const result: MACDPoint[] = data.map(d => ({ date: d.date }));

    const macdLine: (number | null)[] = emaFast.map((fast, i) => {
        const slow = emaSlow[i];
        if (fast !== null && slow !== null) {
            const macd = fast - slow;
            result[i].macd = macd;
            return macd;
        }
        return null;
    });

    const signalLine = calculateEMA(macdLine.filter((v): v is number => v !== null), signalPeriod);

    let signalIndex = 0;
    for (let i = 0; i < macdLine.length; i++) {
        if (macdLine[i] !== null) {
            if (signalIndex < signalLine.length) {
                result[i].signal = signalLine[signalIndex];
                if (result[i].macd !== undefined && result[i].signal !== undefined) {
                    result[i].histogram = result[i].macd! - result[i].signal!;
                }
                signalIndex++;
            }
        }
    }
    return result;
};


/**
 * Calculates the Relative Strength Index (RSI).
 * @param data - Array of historical data points, sorted oldest to newest.
 * @param period - The lookback period, typically 14.
 * @returns An array of RSI indicator points.
 */
export const calculateRSI = (data: HistoricalDataPoint[], period = 14): IndicatorPoint[] => {
    const result: IndicatorPoint[] = new Array(data.length).fill(null).map((_, i) => ({ date: data[i].date, value: null }));
    if (data.length <= period) return result;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const change = data[i].close - data[i - 1].close;
        if (change > 0) {
            gains += change;
        } else {
            losses -= change;
        }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    let rs = avgLoss > 0 ? avgGain / avgLoss : 0;
    result[period] = { date: data[period].date, value: 100 - (100 / (1 + rs)) };
    
    for (let i = period + 1; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close;
        let currentGain = 0;
        let currentLoss = 0;
        
        if (change > 0) {
            currentGain = change;
        } else {
            currentLoss = -change;
        }

        avgGain = (avgGain * (period - 1) + currentGain) / period;
        avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
        
        rs = avgLoss > 0 ? avgGain / avgLoss : 0;
        result[i] = { date: data[i].date, value: 100 - (100 / (1 + rs)) };
    }
    
    return result;
};
