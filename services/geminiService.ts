
import { GoogleGenAI, Type } from "@google/genai";
import { WorkRecord, ReceiptRecord, Client, ClientHealth } from "../types";

// Always initialize GoogleGenAI with the current API key from environment variables
// This follows the recommendation to create the instance right before the call.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseSmartCommand = async (command: string, clients: Client[]): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are an AI assistant for Chronos, a work tracker. 
    Available clients: ${clients.map(c => c.name).join(', ')}. 
    Available actions: 'work' (log time), 'expense' (log money), 'sync' (sync pending), 'report' (summary), 'fix' (polish notes).
    Command: "${command}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: "One of: work, expense, sync, report, fix" },
          clientName: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          durationMinutes: { type: Type.NUMBER },
          notes: { type: Type.STRING },
          category: { type: Type.STRING },
          message: { type: Type.STRING, description: "A friendly status message about what was done" }
        }
      }
    }
  });
  // Use .text property directly
  return JSON.parse(response.text || "{}");
};

export const getStrategicForecast = async (records: WorkRecord[], receipts: ReceiptRecord[], client: Client): Promise<string> => {
  const ai = getAI();
  const data = JSON.stringify({ records: records.slice(-20), receipts: receipts.slice(-10) });
  const response = await ai.models.generateContent({
    // Using Pro model for complex business reasoning and forecasting
    model: 'gemini-3-pro-preview',
    contents: `You are a CFO. Based on this work/expense data for client ${client.name}, predict the total revenue for the end of this month. Identify the biggest 'profit killer' and give 1 strategic move to increase margins. Data: ${data}`,
  });
  return response.text || "";
};

export const analyzeClientHealth = async (records: WorkRecord[], receipts: ReceiptRecord[], clients: Client[]): Promise<ClientHealth[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    // Using Pro model for advanced reasoning across multiple datasets
    model: 'gemini-3-pro-preview',
    contents: `Analyze the profitability of these clients. Compare hours worked vs expenses incurred. Return a JSON array of health metrics (0-100) for each. Clients: ${JSON.stringify(clients)} Records: ${JSON.stringify(records.slice(-50))} Expenses: ${JSON.stringify(receipts.slice(-50))}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            clientId: { type: Type.STRING },
            name: { type: Type.STRING },
            profitability: { type: Type.NUMBER },
            stability: { type: Type.NUMBER },
            growth: { type: Type.NUMBER },
            recommendation: { type: Type.STRING }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};

export const parseReceipt = async (base64Image: string): Promise<any> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      // Correct multi-part content structure using parts array
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] || base64Image } },
          { text: "Extract details into JSON: total amount, vendor, date (YYYY-MM-DD), category, and 'isTaxDeductible' (boolean)." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            vendor: { type: Type.STRING },
            date: { type: Type.STRING },
            category: { type: Type.STRING },
            isTaxDeductible: { type: Type.BOOLEAN }
          },
          required: ["amount", "vendor", "date"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Parse Error:", error);
    return null;
  }
};
