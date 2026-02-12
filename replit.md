# Kepler Data Explorer

## Overview
A beautiful web application for exploring exoplanet data from NASA's Kepler mission. Users can search by Kepler ID, browse featured systems, compare systems side-by-side, view aggregate statistics, save favorites, and get daily system highlights. Each system displays star properties, detected planets, orbital visualizations, size comparisons, and AI-generated summaries.

## Architecture
- **Frontend**: React + Vite, Tailwind CSS, Shadcn UI, Framer Motion
- **Backend**: Express.js
- **Data Source**: NASA Exoplanet Archive TAP API (no database needed)
- **AI**: OpenAI via Replit AI Integrations for generating system summaries and system-of-day highlights
- **Local Storage**: Favorites and compare lists stored in browser localStorage

## Key Routes
- `/` - Home page with search, System of the Day, featured systems, Random System & Browse buttons
- `/discover` - Discover page with category filters, advanced search, browsable system catalog, pagination
- `/stats` - Stats Dashboard with aggregate data, record holders, size/temperature distributions
- `/favorites` - Saved favorite systems
- `/compare` - Compare up to 3 systems side by side
- `/system/:kepid` - Star system detail view with orbital visualization, size comparison, share, favorites
- `/about` - Static informational page about the Kepler mission, Kepler IDs, data explanations, and usage tips

## API Endpoints
- `GET /api/kepler/:kepid` - Fetches data from NASA API, processes it, generates AI summary
- `GET /api/browse?category=all|most-planets|habitable|hot-jupiters|compact|giant-stars&page=1&limit=20` - Browse systems with category filters
- `GET /api/random` - Returns a random Kepler ID from systems with 2+ planets
- `GET /api/stats` - Aggregate statistics from the entire dataset (30-min cache)
- `GET /api/system-of-day` - Deterministic daily featured system with AI description
- `GET /api/search/advanced?minPlanets=&minTemp=&maxTemp=&minSize=&maxSize=&page=&limit=` - Advanced property search
- `GET /api/compare?kepids=id1,id2,id3` - Compare 2-3 systems with raw planet data

## Design
- Space-themed dark mode (default) with light mode support
- Animated starfield background
- Space Grotesk font for headings, JetBrains Mono for data
- Deep blue-black background with bright accent colors

## Features
- **Search**: Direct Kepler ID search
- **Discover**: Category browsing + advanced property search (temp, size, planet count filters)
- **Stats Dashboard**: Record holders (hottest, largest, fastest), size/temp distribution charts
- **Compare**: Side-by-side comparison of up to 3 systems
- **Favorites**: localStorage-based bookmarking, accessible from system detail and browse cards
- **System of the Day**: Deterministic daily highlight with AI-generated description
- **Orbital Visualization**: SVG diagram showing planet positions on detail page
- **Size Comparison**: Visual comparison of discovered planets against Earth, Neptune, Jupiter
- **Share**: Copy-to-clipboard link sharing from detail pages
- **Random System**: Serendipitous discovery from home and discover pages

## Recent Changes
- Added Compare Systems page with side-by-side star/planet comparison
- Added Stats Dashboard with aggregate statistics and distribution charts
- Added Favorites system with localStorage persistence
- Added Advanced Search with planet property filters (temp, size, planet count)
- Added System of the Day with AI-generated highlight on home page
- Added Orbital Visualization and Planet Size Comparison to detail page
- Added About Kepler Mission page (/about) with Kepler ID explanation, data guide, and usage tips; linked from home page and nav bar
- Fixed natural language search: increased max_completion_tokens to 1024/2048 (model needs budget for reasoning tokens), added retry mechanism (3 attempts), added local keyword-based fallback parser
- Fixed AI summaries and System of the Day descriptions (same token budget issue)
- Added Share button to copy system link
- Added Discover page with category-filtered browsing
- Initial build: Full Kepler Data Explorer with NASA API integration, AI summaries, space-themed UI

## Technical Notes
- OpenAI via Replit AI Integrations uses reasoning models that consume tokens internally; `max_completion_tokens` must be set to at least 1024 to get non-empty output
- Natural language search has 3-tier reliability: AI extraction -> retry up to 3 times -> local keyword fallback
