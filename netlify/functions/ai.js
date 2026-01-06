import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const handler = async (event) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { action, payload } = JSON.parse(event.body);
    
    let prompt = "";
    
    switch (action) {
      case "smart-command":
        prompt = `You are an AI assistant for a time tracking app. Parse the following natural language command and extract structured data.
Command: "${payload.command}"
Current clients: ${JSON.stringify(payload.clients || [])}

Respond ONLY with valid JSON in this exact format:
{
  "action": "start" | "stop" | "add" | "query" | "unknown",
  "client": "client name or null",
  "task": "task description or null", 
  "duration": number in minutes or null,
  "date": "YYYY-MM-DD or null",
  "response": "A brief, friendly confirmation message"
}`;
        break;
        
      case "forecast":
        prompt = `Analyze this time tracking data and provide business insights:
${JSON.stringify(payload.entries || [])}

Respond with JSON:
{
  "weeklyAverage": number,
  "projectedMonthly": number,
  "busiestDay": "string",
  "trend": "up" | "down" | "stable",
  "insights": ["insight1", "insight2"]
}`;
        break;
        
      case "client-health":
        prompt = `Analyze client health based on time entries:
${JSON.stringify(payload.entries || [])}

Respond with JSON array of client health scores:
[{
  "client": "name",
  "health": "healthy" | "at-risk" | "critical",
  "hoursThisMonth": number,
  "trend": "up" | "down" | "stable",
  "suggestion": "brief suggestion"
}]`;
        break;
        
      case "parse-receipt":
        prompt = `Extract expense data from this receipt text:
"${payload.text}"

Respond with JSON:
{
  "vendor": "string",
  "amount": number,
  "date": "YYYY-MM-DD",
  "category": "string",
  "description": "string"
}`;
        break;
        
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Unknown action" }),
        };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    let text = response.text || "";
    
    // Clean up markdown code blocks
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const result = JSON.parse(text);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("AI function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "AI processing failed", details: error.message }),
    };
  }
};
