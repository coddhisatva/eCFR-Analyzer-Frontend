"use client";

import { BarChart3, FileText, Hash, History, Link2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function AnalyticsSidebar() {
  const pathname = usePathname();
  const isRegulationPage = pathname.startsWith("/browse/") && pathname !== "/browse";
  
  if (!isRegulationPage) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Select a regulation to view analytics</p>
      </div>
    );
  }

  // Mock data - would be fetched based on the current path
  const analytics = {
    wordCount: 347,
    citationCount: 12,
    lastUpdated: "Mar 2023",
    complexity: "Medium",
    readabilityScore: 42,
    keyTerms: ["rule", "administrative", "procedure", "policy", "regulation"],
    relatedSections: [
      { id: "21-30", name: "Public Procedures" },
      { id: "21-40", name: "Filing Requirements" },
    ]
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Analytics</h3>
      
      <div className="space-y-4">
        <Card className="shadow-sm">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Document Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="grid grid-cols-2 gap-y-1 text-sm">
              <div className="text-gray-500">Words:</div>
              <div className="text-right font-medium">{analytics.wordCount}</div>
              
              <div className="text-gray-500">Citations:</div>
              <div className="text-right font-medium">{analytics.citationCount}</div>
              
              <div className="text-gray-500">Updated:</div>
              <div className="text-right font-medium">Mar 2023</div>
              
              <div className="text-gray-500">Complexity:</div>
              <div className="text-right font-medium">Medium</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm font-medium flex items-center">
              <Hash className="h-4 w-4 mr-2" />
              Key Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="flex flex-wrap gap-1">
              {analytics.keyTerms.map((term) => (
                <span key={term} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {term}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm font-medium flex items-center">
              <Link2 className="h-4 w-4 mr-2" />
              Related Sections
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <ul className="text-sm space-y-1">
              {analytics.relatedSections.map((section) => (
                <li key={section.id}>
                  <Link href="#" className="text-blue-600 hover:underline">
                    § {section.id}: {section.name}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Usage Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <p className="text-sm text-gray-500">
              This section is cited in 8 other regulations
            </p>
            <div className="h-20 bg-gray-100 mt-2 rounded flex items-end">
              <div className="w-1/6 h-4 bg-blue-500 mx-[2px]"></div>
              <div className="w-1/6 h-8 bg-blue-500 mx-[2px]"></div>
              <div className="w-1/6 h-12 bg-blue-500 mx-[2px]"></div>
              <div className="w-1/6 h-6 bg-blue-500 mx-[2px]"></div>
              <div className="w-1/6 h-10 bg-blue-500 mx-[2px]"></div>
              <div className="w-1/6 h-16 bg-blue-500 mx-[2px]"></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm font-medium flex items-center">
              <History className="h-4 w-4 mr-2" />
              Revision History
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <ul className="text-sm space-y-1">
              <li className="flex justify-between">
                <span>Mar 2023</span>
                <Link href="#" className="text-blue-600 hover:underline cursor-pointer">View</Link>
              </li>
              <li className="flex justify-between">
                <span>Jan 2022</span>
                <Link href="#" className="text-blue-600 hover:underline cursor-pointer">View</Link>
              </li>
              <li className="flex justify-between">
                <span>Nov 2020</span>
                <Link href="#" className="text-blue-600 hover:underline cursor-pointer">View</Link>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}