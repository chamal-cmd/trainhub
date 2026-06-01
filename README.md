# Aircall Call Reports Dashboard

An AI-powered call reporting dashboard that pulls live data from Aircall and uses Claude to analyze calls.

## Features
- Live call data from Aircall API
- KPI cards: Total Calls, Avg Duration, Positive Sentiment %, Follow-ups
- Sentiment breakdown donut chart + Call outcomes bar chart
- Sortable, filterable, searchable calls table
- Expandable rows showing topics and action items
- Click any call → detail panel with AI summary
- "Re-analyze with Claude" — streams live AI analysis via Anthropic API
- Export filtered data as CSV

## Setup

### 1. Configure Aircall credentials
Open `server.js` and set:
```
const AIRCALL_API_ID    = 'your_api_id';
const AIRCALL_API_TOKEN = 'your_api_token';
```

### 2. Start the server
```bash
node server.js
```
Then open http://localhost:4001

### 3. Anthropic API key
Click the ⚙ gear icon in the dashboard header and enter your Anthropic API key to enable Claude re-analysis.

## File Structure
```
├── server.js        Node.js proxy server (Aircall API + static files)
├── public/
│   ├── index.html   Dashboard HTML
│   ├── app.js       Dashboard JavaScript
│   └── app.css      Custom styles
└── package.json
```

## Tech Stack
- **Frontend**: Tailwind CSS (CDN), Chart.js (CDN), Vanilla JS
- **Backend**: Node.js (no dependencies — built-in modules only)
- **APIs**: Aircall v1, Anthropic Claude API
