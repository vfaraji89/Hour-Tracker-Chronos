# Chronos

A professional multi-client time tracking application with AI-powered receipt parsing, invoice generation, and strategic business analytics. Built with Google AI Studio.

## Overview

Hour Tracker Chronos is a friendly time tracking and business management dashboard designed for freelancers, consultants, and agencies managing multiple clients. The application combines traditional time tracking with modern AI capabilities to streamline workflow management, financial tracking, and strategic planning.

## Key Features

### Time Tracking
- Real-time timer with start/stop/pause functionality
- Multi-client support with independent tracking per client
- Historical records with detailed session breakdowns
- Task descriptions and notes for each work session

### Client Management
- Multiple client profiles with customizable hourly rates
- Support for multiple currencies (USD, EUR, TRY)
- Google Sheets integration for automatic data synchronization
- Client health monitoring and performance analytics

### Financial Tools
- AI-powered receipt scanning and parsing using camera integration
- Automated expense categorization
- Monthly financial summaries with earnings breakdown
- Invoice generation with detailed work records

### Analytics and Insights
- Calendar view with visual representation of work patterns
- Monthly summary reports with total hours and earnings
- Strategic dashboard with business forecasting
- Client health analysis and trend prediction

### AI Capabilities
- Receipt parsing through Google Gemini AI
- Smart command processing for natural language input
- Strategic business forecasting
- Client relationship health analysis

## Technology Stack

- **Frontend Framework**: React 19.0.0
- **Language**: TypeScript 5.8.2
- **Build Tool**: Vite 6.2.0
- **UI Animations**: Framer Motion 11.11.17
- **Data Visualization**:  Recharts 2.15.0
- **AI Integration**: Google Gemini AI 1.34.0
- **Data Storage**: Local browser storage with Google Sheets sync

## Project Structure

```
Hour-Tracker-Chronos/
├── components/          # React UI components
├── services/           # Business logic and API integrations
│   ├── storageService  # Local data persistence
│   ├── geminiService   # AI integration
│   └── googleSheetService  # Google Sheets sync
├── App.tsx            # Main application component
├── types.ts           # TypeScript type definitions
├── index.tsx          # Application entry point
├── index.html         # HTML template
└── vite.config.ts     # Vite configuration
```

## Prerequisites

Before running the application, ensure you have the following installed:

- Node.js (version 16 or higher)
- npm or yarn package manager
- A Google Gemini API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/vfaraji89/Hour-Tracker-Chronos.git
cd Hour-Tracker-Chronos
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Create a `.env.local` file in the root directory
   - Add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

## Running the Application

### Development Mode

Start the development server with hot module replacement: 

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Production Build

Create an optimized production build:

```bash
npm run build
```

The built files will be output to the `dist` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## Configuration

### Google Gemini API

To enable AI-powered features, you need a valid Google Gemini API key: 

1. Visit [Google AI Studio](https://ai.studio)
3. Add the key to your `.env.local` file

### Google Sheets Integration

To enable automatic data synchronization with Google Sheets:

1. Create a Google Sheet for each client
2. Obtain the shareable URL
3. Add the URL in the client configuration within the application

### Camera Permissions

The application requires camera access for receipt scanning functionality.  Ensure your browser allows camera permissions when prompted.

## Usage

### Adding a Client

1. Navigate to the "Clients" tab
2. Click "Add New Client"
3. Enter client name, hourly rate, and currency
4.  Optionally add Google Sheets URL for synchronization

### Tracking Time

1. Select a client from the dropdown
2. Click "Start Timer" to begin tracking
3. Add task description and notes
4. Click "Stop" to complete the session

### Scanning Receipts

1. Navigate to the "Invoices" tab
2. Click the camera icon to activate receipt scanning
3. Capture or upload a receipt image
4. The AI will automatically parse and categorize the expense

### Viewing Analytics

1. Access the "Strategy" tab for business insights
2. View the "Calendar" tab for visual work patterns
3. Check "Accounts" for monthly financial summaries



## Browser Compatibility

- Chrome 90 and above
- Firefox 88 and above
- Safari 14 and above
- Edge 90 and above


## License

This project is not production ready and is a hobby-format for hackathon.


---

Built with modern web technologies and powered by Google Gemini AI for intelligent business management. 
