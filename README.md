# October 7th Timeline - Memorial Visualization

An interactive timeline visualization displaying the victims of the October 7th, 2023 events and the subsequent two years, built with Kepler.gl.

## Overview

This project creates an interactive map-based timeline over Israel, showing:
- Victims' locations where they were killed
- Timeline animation from October 7, 2023 to present
- Detailed information for each victim on click
- Play/pause functionality to see events unfold over time

## Technology Stack

- **Frontend Framework**: Next.js/React
- **Mapping Library**: Kepler.gl
- **Deployment**: Vercel
- **Data Format**: JSON/CSV

## Features

- 🗺️ Interactive map centered on Israel
- ⏱️ Timeline animation with play controls
- 📍 Click markers to view victim details
- 📊 Data visualization by location, date, and cause
- 📱 Responsive design

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Deployment

This project is configured for automatic deployment to Vercel:

```bash
vercel
```

## Data Structure

The data includes the following fields:
- Name (Last, First)
- Age
- Location of incident
- Date
- Source (e.g., Lebanon, Gaza, etc.)
- Type of incident
- Gender
- Reference URL (if available)

## Project Status

🚧 In Development

See [Issues](../../issues) for planned features and current work.

## Contributing

This is a memorial project. Contributions should be respectful and focused on accuracy and dignified representation.

## License

TBD
