# eCFR Analyzer Frontend

A modern web application for browsing and analyzing the Electronic Code of Federal Regulations (eCFR).
- one of two Repos for project



Live site: https://vercel.com/conor-egans-projects/ecfr-analyzer
Processing Repo:

## Features

- Browse the hierarchical structure of the Code of Federal Regulations
- View regulation content with proper formatting
- Navigation through titles, chapters, subchapters, parts, and sections
- History tracking of regulation changes (coming soon)
- Analytics and insights about regulation content (coming soon)

## Technology Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- React
- ShadCN UI Components

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API with regulation data

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ecfr-frontend.git
   cd ecfr-frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_API_URL=http://localhost:8000  # URL to your backend API
```

## Connecting to the Real Database

The application is designed to work with a backend API that provides regulation data. To connect to your actual database:

### 1. Update the Navigation API

Edit `src/app/api/navigation/route.ts` to fetch real data from your backend:

```typescript
// Replace this function with a real API call
async function fetchRegulationNodes(): Promise<RegulationNode[]> {
  try {
    // Call your actual backend API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nodes`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch regulation nodes');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching regulation nodes:', error);
    return [];
  }
}
```

### 2. Update the Regulation Content API

Edit `src/app/api/regulation/route.ts` to fetch real content from your backend:

```typescript
// Inside the GET function
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/regulation?path=${encodeURIComponent(path)}`);
const data = await response.json();

return NextResponse.json({
  nodeInfo: data.nodeInfo,
  content: data.content,
  childNodes: data.childNodes
});
```

### 3. Backend API Requirements

Your backend needs to provide the following endpoints:

1. `/api/nodes` - Returns all regulation nodes for the navigation tree
   ```json
   [
     {
       "id": "title-1",
       "citation": "Title 1",
       "link": "/title=1",
       "node_type": "structure",
       "level_type": "title",
       "number": "1",
       "node_name": "General Provisions",
       "parent": null
     },
     ...
   ]
   ```

2. `/api/regulation?path=title=4/chapter=I` - Returns information about a specific regulation path
   ```json
   {
     "nodeInfo": {
       "id": "...",
       "citation": "...",
       "link": "...",
       "node_type": "structure|content",
       "level_type": "title|chapter|part|section",
       "number": "...",
       "node_name": "...",
       "parent": "..."
     },
     "content": ["<p>HTML content...</p>", ...],
     "childNodes": [...]
   }
   ```

## Project Structure

- `/src/app` - Next.js app router pages
- `/src/components` - React components
- `/src/types` - TypeScript type definitions
- `/src/app/api` - API routes for fetching data
  - `/navigation` - API route for fetching navigation tree
  - `/regulation` - API route for fetching regulation content

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
