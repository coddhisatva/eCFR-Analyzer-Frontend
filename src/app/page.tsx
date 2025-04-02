import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function HomePage() {
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

        {/* Search Bar */}
        <div className="relative">
          <Input
            type="search"
            placeholder="Example: requirements for financial institutions..."
            className="w-full h-12 pl-4 pr-12 text-lg"
          />
          <Button
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2"
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
      </div>
    </div>
  );
}