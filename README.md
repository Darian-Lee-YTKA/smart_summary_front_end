# Smart Summary Frontend

A React-based web application for generating comprehensive industry analysis reports from financial data.

## Important Note

**This codebase is largely AI-generated.** I don't have extensive React experience, so most of the code structure, components, and implementation details were created with AI assistance. If you're reviewing this code, please keep in mind that it may not follow React best practices or conventional patterns that experienced React developers would typically use. I figured that since this is just a temporary prototype, this lack of rigor would likely not be an issue

## Overview

This application allows users to:
- Upload financial reports (Excel/CSV files)
- Configure industry and competitor data
- Generate comprehensive analysis reports with AI-powered insights
- View results in multiple formats (text, tables, raw data)
- Copy formatted reports for sharing

## Tech Stack

- **Frontend**: React with functional components and hooks
- **Styling**: CSS with inline styles (not using a CSS framework)
- **Authentication**: Clerk for user authentication
- **File Processing**: Base64 encoding for file uploads
- **Data Visualization**: Custom table components
- **PDF Export**: jsPDF and html2canvas
- **Document Generation**: docx library

## Project Structure

```
smart_summary_front_end/
├── public/
│   ├── videos/                 # Tutorial GIFs for user guide
│   │   ├── default_reports.gif
│   │   ├── sign_in.gif
│   │   ├── add_your_data.gif
│   │   └── copy_text.gif
│   ├── text_view_img.png       # Screenshots for user guide
│   ├── table_view_img.png
│   └── jirav.svg              # Logo
├── src/
│   ├── App.js                 # Main application component
│   ├── EconomicIndicatorsBox.js # Economic indicators component
│   └── style.css              # Global styles
└── build/                     # Production build (auto-generated)
```

## Main Components

### App.js (Main Component)
The primary component containing all application logic:

**State Management:**
- Form data (company info, NAICS codes, competitors)
- File uploads (Excel/CSV reports)
- API responses (summaries, competitor data, economic indicators)
- UI state (modals, tabs, loading states)

**Key Functions:**
- `handleGetTrends()` - Main API call to generate report summary
- `handleNaicsSubmit()` - Fetch competitor suggestions
- `renderUserGuide()` - User guide modal with tutorials
- `renderClientDataModal()` - Data configuration modal
- `renderTable()` - Table rendering for various data formats

**File Upload System:**
- Supports Excel and CSV files
- Converts files to Base64 for API transmission
- Handles multiple report types (Income Statement, Balance Sheet, etc.)
- Folder upload mode for bulk file processing

### EconomicIndicatorsBox.js
Component for selecting economic indicators:
- Dropdown selection for FRED data
- State and national economic metrics
- Custom styling with hover effects

## API Integration

**Backend Endpoint:** `https://external-data-backend.onrender.com/`

**Key Endpoints:**
- `/get_trends/` - Generate main report summary
- `/add_company_data/` - Fetch competitor suggestions

**Data Flow:**
1. User uploads financial files → Base64 conversion
2. User configures industry data (NAICS, competitors, economic indicators)
3. API call with all data → Backend processes with LLM
4. Response includes: summary, competitor data, economic trends, table formats
5. Frontend displays results in multiple tabs

## User Interface

**Multi-Step Workflow:**
1. **Industry Selection** - NAICS code input with competitor suggestions
2. **Data Configuration** - Economic indicators and additional settings
3. **File Upload** - Financial reports upload
4. **Report Generation** - AI-powered analysis
5. **Results View** - Multiple format tabs (text, tables, raw data)

**User Guide System:**
- Interactive modal with step-by-step tutorials
- GIF demonstrations for each major feature
- FAQ section explaining the AI analysis process

## Key Features

### Report Generation
- Combines user financial data with external sources
- Uses algorithmic calculations + LLM for natural language summaries
- Includes competitor analysis from SEC filings
- Economic trend integration from FRED data

### Data Export
- Copy formatted email templates
- PDF export functionality
- Word document generation
- Multiple view formats for different use cases

### Authentication
- Optional user accounts via Clerk
- Saves user preferences and company data
- Privacy-focused (no financial file storage)

## Code Organization Notes

**What's AI-Generated:**
- Most component structure and state management
- API integration patterns
- Styling and layout decisions
- Error handling implementations
- File processing logic

**Potential Areas for Improvement:**
- State management could use Redux or Context API
- Styling could benefit from a CSS framework
- Component separation could be more granular
- Error handling could be more comprehensive
- TypeScript would improve type safety

## Development

**Local Development:**
```bash
npm install
npm start
```

**Production Build:**
```bash
npm run build
```

**Dependencies:**
- React and React DOM
- Clerk for authentication
- jsPDF and html2canvas for PDF export
- docx for Word document generation
- html2canvas for PDF generation

## Deployment

The application is configured for deployment on Netlify with:
- `netlify.toml` configuration
- `_redirects` file for SPA routing
- Build folder contains production assets

## API Response Structure

The backend returns structured responses:

```javascript
{
  success: true,
  data: {
    summary: "AI-generated analysis...",
    user_data: {...},
    industry_tables: [...],
    fred_data: {...},
    trends: {...},
    table_formats: [...]
  }
}
```

