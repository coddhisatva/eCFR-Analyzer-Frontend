# eCFR Analyzer Frontend

A modern web application for browsing and analyzing the Electronic Code of Federal Regulations (eCFR).
- one of two Repos for project

Live site: https://ecfr-analyzer-lyart.vercel.app

Processing Repo: https://github.com/coddhisatva/eCFR-Analyzer-Scripting

## Features

- Browse the hierarchical structure of the Code of Federal Regulations, including their analytics
  - and see their related agencies, which link you to agency view
- View regulation content
- Browse federal Agencies, featuring in-depth analytics of each agency, as well as overall agency analytics by content and corrections
  - Each agency displays and links to its exact subagencies, and CFR references
- Broad metrics on historical regulation corrections
- Ability to search for corrections based on range of dates
- Query for regulations based on keywords, name, and title
- Intuitive breadcrumb navigation for easy traversal of the regulation hierarchy

## Technology Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- React
- ShadCN UI Components
- Supabase for db 

## Project Structure

```
src/
├── app/                 # Next.js app router pages and API routes
│   ├── api/            # API routes for data fetching
│   ├── agency/         # Agency-related pages
│   ├── browse/         # Regulation browsing pages
│   └── corrections/    # Corrections-related pages
├── components/         # Reusable UI components
├── lib/               # Utility functions and shared logic
│   └── supabase.ts    # Supabase client configuration
├── types/             # TypeScript type definitions
└── hooks/             # Custom React hooks
```

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
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_KEY=your_supabase_anon_key

# Optional: App URL for development
NEXT_PUBLIC_APP_URL=http://localhost:3000
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

### 3. Project Structure

- `/src/app` - Next.js app router pages
- `/src/components` - React components
- `/src/types` - TypeScript type definitions
- `/src/app/api` - API routes for fetching data
  - `/navigation` - API route for fetching navigation tree
  - `/regulation` - API route for fetching regulation content
