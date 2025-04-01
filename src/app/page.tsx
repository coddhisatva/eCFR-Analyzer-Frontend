import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Welcome to eCFR Analyzer</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Browse Regulations</h2>
          <p className="text-gray-600 mb-4">
            Navigate through titles, chapters, subchapters, and sections of the Electronic Code of Federal Regulations.
          </p>
          <Link 
            href="/browse" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Start browsing →
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Search Regulations</h2>
          <p className="text-gray-600 mb-4">
            Search through the full text of the eCFR to find specific regulations and requirements.
          </p>
          <a 
            href="/search" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Search eCFR →
          </a>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Analytics</h2>
          <p className="text-gray-600 mb-4">
            Explore statistics, relationships, and insights into regulatory content.
          </p>
          <a 
            href="/analytics" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            View analytics →
          </a>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">AI-Assisted Chat</h2>
          <p className="text-gray-600 mb-4">
            Ask questions about regulations and get AI-powered answers based on eCFR content.
          </p>
          <a 
            href="/chat" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Start chatting →
          </a>
        </div>
      </div>
    </div>
  );
}