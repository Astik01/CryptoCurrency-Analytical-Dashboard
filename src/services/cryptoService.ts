import axios from 'axios';
import { CryptoData, CryptoChartData } from '../types/crypto';

const API_BASE_URL = 'https://api.coingecko.com/api/v3';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded. Please try again later.');
    }
    return Promise.reject(error);
  }
);

export const fetchTopCryptos = async (): Promise<CryptoData[]> => {
  try {
    const response = await api.get('/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 250, // Increased from 100 to 250
        page: 1,
        sparkline: false,
        price_change_percentage: '24h',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching cryptocurrencies:', error);
    throw error;
  }
};

export const fetchCryptoChartData = async (id: string, days: string): Promise<CryptoChartData> => {
  try {
    const response = await api.get(`/coins/${id}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: days,
        interval: days === '1' ? 'hourly' : 'daily',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching chart data for ${id}:`, error);
    throw error;
  }
}; 