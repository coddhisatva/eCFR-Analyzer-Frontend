"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Link from "next/link";

interface SearchResult {
  id: string;
  content: string;
  chunkNumber: number;
  section: {
    id: string;
    levelType: string;
    number: string;
    name: string;
    citation: string;
    parent: string | null;
  };
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(data.results);
    } catch (err) {
      setError((err as Error).message);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="w-full max-w-3xl space-y-8 -mt-32">
        {/* Hero Text */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Search eCFR Documentation
          </h1>
          <p className="text-lg text-gray-600">
            Search through the Electronic Code of Federal Regulations
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <Input
              type="search"
              placeholder="Example: requirements for financial institutions..."
              className="w-full h-12 pl-4 pr-12 text-lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              disabled={isLoading}
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>

          {/* Filter Panel */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h2 className="font-medium mb-4">Filters</h2>
            <div className="text-sm text-gray-500">
              Filter options coming soon...
            </div>
          </div>
        </form>

        {/* Results */}
        {isLoading ? (
          <div className="text-center text-gray-600">Searching...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : results.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">
              Found {results.length} results
            </h2>
            <div className="space-y-8">
              {results.map((result) => (
                <div key={result.id} className="border rounded-lg p-4 space-y-2">
                  <Link
                    href={`/browse/${result.section.id.split('us/federal/ecfr/')[1]}`}
                    className="text-blue-600 hover:underline font-medium block"
                  >
                    {result.section.citation}
                  </Link>
                  <h3 className="text-gray-900">{result.section.name}</h3>
                  <p className="text-sm text-gray-600">{result.content}</p>
                </div>
              ))}
            </div>
          </div>
        ) : query && (
          <div className="text-center text-gray-600">No results found</div>
        )}
      </div>
    </div>
  );
}