
/**
 * Gemini AI Service - Secure Backend Proxy
 * 
 * All AI calls are routed through the backend server to protect the API key.
 * The API key is NEVER exposed to the client.
 * 
 * Works with:
 * - Local dev: Express server via Vite proxy (/api/ai/*)
 * - Netlify: Netlify Functions (/.netlify/functions/ai)
 */

import { WorkRecord, ReceiptRecord, Client, ClientHealth } from "../types";

// Detect environment and set appropriate API endpoint
const isNetlify = typeof window !== 'undefined' && 
  (window.location.hostname.includes('netlify') || 
   window.location.hostname.includes('.app'));

const API_BASE = isNetlify ? '/.netlify/functions/ai' : '/api/ai';

// Generic fetch wrapper with error handling
const apiCall = async <T>(action: string, payload: object): Promise<T> => {
  // For Netlify, send action in body; for local dev, use endpoint path
  const url = isNetlify ? API_BASE : `${API_BASE}/${action}`;
  const body = isNetlify ? { action, payload } : payload;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.message || error.error || `API error: ${response.status}`);
  }

  return response.json();
};

/**
 * Smart command interface result type
 */
interface SmartCommandResult {
  type: 'work' | 'expense' | 'sync' | 'report' | 'fix';
  clientName?: string;
  amount?: number;
  durationMinutes?: number;
  notes?: string;
  category?: string;
  message?: string;
}

/**
 * Parse a natural language command using AI
 */
export const parseSmartCommand = async (command: string, clients: Client[]): Promise<SmartCommandResult> => {
  return apiCall<SmartCommandResult>('smart-command', { command, clients });
};

/**
 * Get strategic business forecast
 */
export const getStrategicForecast = async (
  records: WorkRecord[], 
  receipts: ReceiptRecord[], 
  client: Client
): Promise<string> => {
  const result = await apiCall<{ forecast: string }>('forecast', { records, receipts, client });
  return result.forecast;
};

/**
 * Analyze client health and profitability
 */
export const analyzeClientHealth = async (
  records: WorkRecord[], 
  receipts: ReceiptRecord[], 
  clients: Client[]
): Promise<ClientHealth[]> => {
  return apiCall<ClientHealth[]>('client-health', { records, receipts, clients });
};

/**
 * Receipt parsing result type
 */
interface ReceiptParseResult {
  amount: number;
  vendor: string;
  date: string;
  category?: string;
  isTaxDeductible?: boolean;
}

/**
 * Parse a receipt image using AI vision
 */
export const parseReceipt = async (base64Image: string): Promise<ReceiptParseResult | null> => {
  try {
    return await apiCall<ReceiptParseResult>('parse-receipt', { image: base64Image });
  } catch (error) {
    console.error("Receipt parse error:", error);
    return null;
  }
};

/**
 * Check if the AI backend is available
 */
export const checkAIHealth = async (): Promise<boolean> => {
  try {
    // For Netlify, just return true (functions are always available)
    if (isNetlify) return true;
    
    const response = await fetch('/api/health');
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
};
