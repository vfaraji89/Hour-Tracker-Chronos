<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Chronos -- AI-Powered Multi-Client Time Tracker

**Live App:** [Mesa Chronos on Netlify](https://mesa-chronos.netlify.app)

---

## Inspiration

Freelancers and consultants lose an average of lots of hours per week on administrative overhead: tracking time across clients, organizing receipts, forecasting cash flow, and deciding which clients are actually profitable. 

Most time trackers solve only one of these problems. We built Chronos to solve all of them in one place, with AI doing the heavy lifting that humans should not have to do manually.

The release of Gemini 3 made this possible. Flash handles the fast, real-time interactions (parsing natural language commands, extracting receipt data from photos), while Pro handles the deep analytical work (cross-client profitability analysis, strategic revenue forecasting). Two models, each applied where its strengths matter most.

## What It Does

Chronos is a professional time tracking and business intelligence platform designed for freelancers, consultants, and small agencies managing multiple clients simultaneously. It combines four AI-powered capabilities with traditional project management tools:

**AI-Powered Natural Language Command Bar** -- Type plain English like "log 2 hours for Acme on design work" or "sync all pending records" and Gemini 3 Flash interprets your intent, identifies the action type, matches the correct client, and executes it. No buttons, no forms, no friction.

**AI Receipt Scanner** -- Photograph any receipt and Gemini 3 Flash's vision capability extracts the vendor name, total amount, date, expense category, and tax deductibility status. Parsed data is automatically attached to the active client and synced to their Google Sheet.

**Strategic Revenue Forecasting** -- Gemini 3 Pro analyzes your historical work records and expenses per client, then generates CFO-level revenue predictions for the current month. It identifies your biggest profit killers and recommends one concrete strategic move to increase margins.

**Cross-Client Health Analysis** -- Gemini 3 Pro scores every client on three dimensions (profitability 0-100, stability 0-100, growth potential 0-100) and provides actionable recommendations. This answers the question every freelancer struggles with: "Which clients are actually worth my time?"

Beyond AI, Chronos includes a real-time timer with idle detection, a calendar heatmap for visualizing work patterns, per-client task management with priorities, monthly earnings summaries with multi-currency conversion (USD, EUR, TRY), and automatic cloud backup to Google Sheets via Apps Script.

## How We Built It

### Architecture

Chronos is a single-page React application that communicates directly with the Gemini API on the client side. There is no backend server -- all data persistence uses browser LocalStorage with quota management, and cloud sync is handled through Google Apps Script endpoints configured per client.

```
User Input
   |
   v
React 19 (TypeScript) + Tailwind CSS + Framer Motion
   |
   +--> geminiService.ts --> Gemini 3 Flash (commands, receipts)
   |                     --> Gemini 3 Pro (forecasting, health analysis)
   |
   +--> storageService.ts --> Browser LocalStorage
   |
   +--> googleSheetService.ts --> Google Apps Script Web App
```

### Gemini 3 Integration Details

We use the `@google/genai` SDK (v1.34.0) and make four distinct types of API calls:

| Feature | Model | Why This Model | Input | Output |
|---|---|---|---|---|
| Smart Commands | `gemini-3-flash-preview` | Speed-critical; user is waiting for real-time response | Natural language text + client list context | Structured JSON with action type, duration, notes, category |
| Receipt Scanning | `gemini-3-flash-preview` | Fast multimodal processing for camera capture flow | Base64 image + extraction prompt | Structured JSON with amount, vendor, date, category, tax status |
| Strategic Forecasting | `gemini-3-pro-preview` | Requires deep reasoning across financial time-series data | Last 20 work records + 10 receipts + client metadata | Free-text CFO-style analysis with predictions |
| Client Health | `gemini-3-pro-preview` | Cross-dataset comparison requiring advanced analytical reasoning | All records + receipts + full client list | Structured JSON array with profitability, stability, growth scores |

Every structured output call uses `responseMimeType: "application/json"` with a full `responseSchema` definition, ensuring type-safe, predictable responses that the frontend can consume without brittle text parsing.

### Key Technical Decisions

- **No backend by design.** Everything runs client-side. The Gemini API key is loaded from environment variables at build time. This eliminates server costs and deployment complexity, which matters for a tool targeting independent freelancers.
- **Two-model strategy.** Flash for latency-sensitive interactions (sub-second command parsing, receipt scanning). Pro for depth-sensitive analysis (forecasting, multi-client health scoring). This is not arbitrary -- the distinction maps directly to user expectations about response time vs. insight quality.
- **Structured JSON schemas on all applicable calls.** Rather than prompting for JSON and hoping, we use Gemini's native `responseSchema` parameter. This guarantees the response shape matches our TypeScript interfaces.
- **Per-client Google Sheets sync.** Each client can have their own Google Sheet endpoint. Work records and receipts sync independently. This means a freelancer's client data stays isolated, which is a real compliance consideration.

## Challenges We Ran Into

**Multimodal input formatting.** The Gemini 3 SDK expects a specific `parts` array structure for vision inputs, with `inlineData` containing `mimeType` and `data` fields. Getting the base64 encoding right (stripping the data URL prefix) required careful handling to avoid silent failures where the model would return empty results instead of errors.

**Balancing model selection.** Early prototypes used Flash for everything. The forecasting output was fast but shallow -- generic recommendations that could apply to any business. Switching to Pro for analytical features dramatically improved output quality, but we had to restructure the UI to set appropriate expectations around response time (adding loading states, progress indicators).

**LocalStorage quota management.** With work records, receipts, tasks, and settings all stored client-side, we had to implement careful quota monitoring. A user with months of data across multiple clients can approach the 5MB limit. The storage service includes quota checks and warns users before they hit the wall.

**Google Sheets sync reliability.** Apps Script web apps have cold start latency and occasional timeout issues. We implemented per-record sync status tracking (pending, syncing, synced, failed) with retry capabilities and a bulk sync function, so users never lose data even if individual sync attempts fail.

## Accomplishments We Are Proud Of

- The natural language command bar genuinely works as a replacement for traditional UI forms. In testing, logging time through the command bar is 3-4x faster than clicking through timer start/stop flows.
- Receipt scanning accuracy is high enough to be useful in practice. Gemini 3 Flash correctly extracts amount, vendor, and date from most standard receipts on the first attempt.
- The client health analysis produces genuinely differentiated recommendations per client, not generic advice. It considers the ratio of hours worked to expenses incurred and identifies specific patterns.
- The entire application works offline (except AI features) because all core data is in LocalStorage. Cloud sync is additive, not required.

## What We Learned

- Gemini 3's structured output with `responseSchema` is a significant improvement over prompt-based JSON extraction. It eliminates an entire class of parsing bugs.
- The Flash vs. Pro distinction is not just about cost -- it maps to fundamentally different user experience patterns. Flash enables conversational, real-time interactions. Pro enables analytical, report-style outputs. Designing the UI around these different interaction patterns matters.
- For freelancer tools, data isolation per client is not optional. It is a trust requirement. The per-client Google Sheets architecture reflects this.

## What Is Next for Chronos

- **Invoice generation.** Use Gemini to auto-generate invoices from work records and receipts, formatted per client preferences.
- **Predictive scheduling.** Analyze calendar patterns to suggest optimal work blocks per client based on historical productivity data.
- **Team mode.** Extend the multi-client model to multi-user, allowing small agencies to aggregate time tracking across team members.
- **Mobile PWA.** Add service worker support for full offline capability and push notifications for idle detection alerts.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS |
| Animation | Framer Motion |
| Charts | Recharts |
| AI | Google Gemini 3 API (`@google/genai` v1.34.0) -- Flash + Pro models |
| Storage | Browser LocalStorage with quota management |
| Cloud Sync | Google Sheets via Apps Script |
| Build | Vite 6.2 |
| Deploy | Netlify |
| Languages | English, Turkish (full i18n) |

## Run Locally

**Prerequisites:** Node.js 16+

```bash
git clone https://github.com/vfaraji89/Hour-Tracker-Chronos.git
cd Hour-Tracker-Chronos
npm install
```

Create a `.env.local` file:

```
GEMINI_API_KEY=your_api_key_here
```

Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey).

```bash
npm run dev
```

Open `http://localhost:3000`.

## Project Structure

```
Chronos/
├── App.tsx                    # Root component, state management, AI orchestration
├── index.html                 # Entry point with Tailwind + importmap
├── types.ts                   # TypeScript interfaces for all data models
├── translations.ts            # Full i18n support (English + Turkish)
├── components/
│   ├── TimerDisplay.tsx       # Real-time timer with idle detection
│   ├── HistoryList.tsx        # Work record management and editing
│   ├── MonthlySummary.tsx     # Monthly earnings breakdown
│   ├── CalendarView.tsx       # Work pattern heatmap calendar
│   ├── ReceiptManager.tsx     # AI-powered receipt scanning and management
│   ├── StrategyDashboard.tsx  # AI forecasting + client health analytics
│   ├── TaskDashboard.tsx      # Per-client task backlog with priorities
│   ├── Settings.tsx           # App configuration and data management
│   └── CloudSetupGuide.tsx    # Google Sheets integration walkthrough
├── services/
│   ├── geminiService.ts       # All Gemini 3 API calls (Flash + Pro)
│   ├── storageService.ts      # LocalStorage persistence with quota handling
│   └── googleSheetService.ts  # Google Sheets sync via Apps Script
└── netlify.toml               # Deployment configuration
```

## License

Built for the [Google Gemini 3 Hackathon](https://gemini3.devpost.com/) on Devpost.

