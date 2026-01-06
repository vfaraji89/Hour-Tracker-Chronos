/**
 * Chronos Backend Server
 * Secure proxy for Gemini AI API calls
 * 
 * This keeps the API key on the server-side only.
 */

import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// Validate API key exists
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in environment variables!');
  console.error('   Please add GEMINI_API_KEY to your .env.local file');
  process.exit(1);
}

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Allow larger payloads for images

// Rate limiting (simple in-memory implementation)
const rateLimiter = new Map();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

const checkRateLimit = (ip) => {
  const now = Date.now();
  const userRequests = rateLimiter.get(ip) || [];
  
  // Clean old requests
  const recentRequests = userRequests.filter(time => now - time < RATE_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimiter.set(ip, recentRequests);
  return true;
};

// Middleware for rate limiting
const rateLimitMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ 
      error: 'Too many requests. Please try again later.',
      retryAfter: 60 
    });
  }
  next();
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Chronos API',
    timestamp: new Date().toISOString()
  });
});

/**
 * Parse smart command using AI
 */
app.post('/api/ai/smart-command', rateLimitMiddleware, async (req, res) => {
  try {
    const { command, clients } = req.body;
    
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Command is required' });
    }
    
    const clientNames = Array.isArray(clients) 
      ? clients.map(c => c.name).join(', ') 
      : 'Default Client';

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `You are an AI assistant for Chronos, a work tracker. 
      Available clients: ${clientNames}. 
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

    const result = JSON.parse(response.text);
    res.json(result);
    
  } catch (error) {
    console.error('Smart command error:', error.message);
    res.status(500).json({ 
      error: 'Failed to process command',
      message: error.message 
    });
  }
});

/**
 * Get strategic forecast
 */
app.post('/api/ai/forecast', rateLimitMiddleware, async (req, res) => {
  try {
    const { records, receipts, client } = req.body;
    
    if (!client) {
      return res.status(400).json({ error: 'Client data is required' });
    }

    const data = JSON.stringify({ 
      records: (records || []).slice(-20), 
      receipts: (receipts || []).slice(-10) 
    });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `You are a CFO. Based on this work/expense data for client ${client.name}, predict the total revenue for the end of this month. Identify the biggest 'profit killer' and give 1 strategic move to increase margins. Data: ${data}`,
    });

    res.json({ forecast: response.text });
    
  } catch (error) {
    console.error('Forecast error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate forecast',
      message: error.message 
    });
  }
});

/**
 * Analyze client health
 */
app.post('/api/ai/client-health', rateLimitMiddleware, async (req, res) => {
  try {
    const { records, receipts, clients } = req.body;
    
    if (!clients || !Array.isArray(clients)) {
      return res.status(400).json({ error: 'Clients data is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Analyze the profitability of these clients. Compare hours worked vs expenses incurred. Return a JSON array of health metrics (0-100) for each. Clients: ${JSON.stringify(clients)} Records: ${JSON.stringify((records || []).slice(-50))} Expenses: ${JSON.stringify((receipts || []).slice(-50))}`,
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

    const result = JSON.parse(response.text);
    res.json(result);
    
  } catch (error) {
    console.error('Client health error:', error.message);
    res.status(500).json({ 
      error: 'Failed to analyze client health',
      message: error.message 
    });
  }
});

/**
 * Parse receipt image
 */
app.post('/api/ai/parse-receipt', rateLimitMiddleware, async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Base64 image is required' });
    }

    // Extract base64 data (remove data URL prefix if present)
    const base64Data = image.includes(',') ? image.split(',')[1] : image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
        { text: "Extract details into JSON: total amount, vendor, date (YYYY-MM-DD), category, and 'isTaxDeductible' (boolean)." }
      ],
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

    const result = JSON.parse(response.text);
    res.json(result);
    
  } catch (error) {
    console.error('Receipt parse error:', error.message);
    res.status(500).json({ 
      error: 'Failed to parse receipt',
      message: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Chronos API Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Status:    Running`);
  console.log(`   Port:      ${PORT}`);
  console.log(`   API Key:   ${API_KEY ? '✓ Configured' : '✗ Missing'}`);
  console.log(`   Endpoints:`);
  console.log(`     GET  /api/health`);
  console.log(`     POST /api/ai/smart-command`);
  console.log(`     POST /api/ai/forecast`);
  console.log(`     POST /api/ai/client-health`);
  console.log(`     POST /api/ai/parse-receipt`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
});

export default app;
