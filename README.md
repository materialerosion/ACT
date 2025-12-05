# PULSE - Personas Used in Lifelike Synthetic Experiences

A comprehensive web application that generates synthetic consumer personas using AI and analyzes their preferences against product concepts. Built with Next.js, TypeScript, and integrated with Bayer's AI API.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
- [API Integration](#api-integration)
- [Project Structure](#project-structure)
- [Building and Deployment](#building-and-deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Support](#support)

## Features

### 🎯 AI-Powered Profile Generation
- Generate ~100 diverse consumer profiles based on demographic inputs
- Customizable demographics: age, gender, location, income, education
- Realistic and varied profile characteristics including lifestyle, interests, and behaviors

### 📊 Preference Analysis
- Test product concepts against generated consumer profiles
- Analyze preferences, innovativeness, and differentiation scores (1-10 scale)
- AI-generated reasoning for each consumer's response

### 📈 Data Visualization
- Interactive charts and graphs using Chart.js
- Bar charts comparing concepts performance
- Radar charts showing overall performance
- Performance rankings and insights

### 📋 Report Generation
- Downloadable PDF reports with comprehensive analysis
- Excel workbooks with detailed data sheets
- CSV exports for custom analysis
- Professional formatting with insights and recommendations

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Chart.js, React-Chartjs-2
- **Reports**: jsPDF, xlsx
- **Icons**: Lucide React
- **AI Integration**: OpenAI SDK with Bayer AI endpoint

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/materialerosion/ACT.git
```

2. Navigate to the project directory:
```bash
cd ACT
```

3. Install dependencies:
```bash
npm install
```

4. Environment variables are already configured in `.env.local`

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### Step 1: Define Demographics
- Select target age ranges, genders, locations, income levels, and education
- The system will generate approximately 100 diverse consumer profiles

### Step 2: Add Product Concepts
- Input product concepts you want to test
- Provide detailed descriptions for each concept
- Use sample concepts or create custom ones

### Step 3: Analysis
- The AI analyzes each profile against each concept
- Generates scores for preference, innovativeness, and differentiation
- Provides reasoning for each consumer's response

### Step 4: View Results
- Interactive dashboards with charts and insights
- Download comprehensive reports in multiple formats
- Export data for further analysis

## API Integration

The application integrates with Bayer's AI API at:
- **Endpoint**: https://chat.int.bayer.com/api/v2
- **API Key**: mga-43f1e1d862c23c4692b29c5ceb0b9a00ab802351

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts          # Preference analysis endpoint
│   │   └── profiles/generate/route.ts # Profile generation endpoint
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Main application page
├── components/
│   ├── Analytics.tsx                 # Data visualization components
│   ├── ConceptsForm.tsx             # Concepts input form
│   ├── DemographicForm.tsx          # Demographics input form
│   └── ReportDownload.tsx           # Report generation interface
├── services/
│   ├── aiService.ts                 # AI integration service
│   └── reportService.ts             # Report generation service
└── types/
    └── index.ts                     # TypeScript type definitions
```

## Building and Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Troubleshooting

### Common Issues

1. **API Connection**: Ensure network access to Bayer's AI endpoint
2. **Large Datasets**: Processing 100 profiles may take 2-3 minutes
3. **Browser Compatibility**: Modern browsers required for chart rendering

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch: `git checkout -b my-new-feature`
3. Make your changes and commit them: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request.

## Support

For technical support or questions about this consumer analysis tool, refer to the application documentation or contact the development team.
