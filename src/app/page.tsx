"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

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

const TITLES = Array.from({ length: 50 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `Title ${i + 1}`
}));

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Build URL with title filters
      const params = new URLSearchParams();
      params.set('q', query);
      selectedTitles.forEach(title => params.append('titles[]', title));
      
      const response = await fetch(`/api/search?${params.toString()}`);
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

  const toggleTitle = (title: string) => {
    setSelectedTitles(prev => 
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
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
          <div className="border rounded-lg p-4 bg-white shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-medium">Filter by Title</h2>
              {selectedTitles.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTitles([])}
                  className="text-gray-500 text-sm"
                >
                  Clear all
                </Button>
              )}
            </div>
            
            {/* Selected Titles */}
            {selectedTitles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTitles.map(title => (
                  <Badge
                    key={title}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Title {title}
                    <button
                      onClick={() => toggleTitle(title)}
                      className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Title Grid */}
            <div className="grid grid-cols-5 gap-2">
              {TITLES.map(title => (
                <button
                  key={title.value}
                  onClick={() => toggleTitle(title.value)}
                  type="button"
                  className={`p-2 text-sm rounded hover:bg-gray-100 transition-colors ${
                    selectedTitles.includes(title.value)
                      ? 'bg-gray-100 font-medium'
                      : ''
                  }`}
                >
                  {title.value}
                </button>
              ))}
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
              {selectedTitles.length > 0 && (
                <span className="text-gray-500 text-base font-normal">
                  {' '}in {selectedTitles.length} title{selectedTitles.length > 1 ? 's' : ''}
                </span>
              )}
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