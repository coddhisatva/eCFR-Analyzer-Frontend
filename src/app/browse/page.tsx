import Link from "next/link";
import { RegulationNode } from "@/types/regulation";

// In the future, this would fetch from your backend
async function fetchTitles(): Promise<RegulationNode[]> {
  // Mock data for now
  return [
    {
      id: "title-1",
      citation: "Title 1",
      link: "/title=1",
      node_type: "structure",
      level_type: "title",
      number: "1",
      node_name: "General Provisions"
    },
    {
      id: "title-2",
      citation: "Title 2",
      link: "/title=2",
      node_type: "structure",
      level_type: "title",
      number: "2",
      node_name: "Grants and Agreements"
    },
    {
      id: "title-3",
      citation: "Title 3",
      link: "/title=3",
      node_type: "structure",
      level_type: "title",
      number: "3",
      node_name: "The President"
    },
    {
      id: "title-4",
      citation: "Title 4",
      link: "/title=4",
      node_type: "structure",
      level_type: "title",
      number: "4",
      node_name: "Accounts"
    },
    {
      id: "title-5",
      citation: "Title 5",
      link: "/title=5",
      node_type: "structure",
      level_type: "title",
      number: "5",
      node_name: "Administrative Personnel"
    }
  ];
}

export default async function Browse() {
  const titles = await fetchTitles();

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Code of Federal Regulations</h1>
      
      <div className="mb-6">
        <p className="text-gray-700 mb-4">
          The Code of Federal Regulations (CFR) is the codification of general and permanent rules 
          published in the Federal Register by the executive departments and agencies of the Federal Government.
        </p>
        <p className="text-gray-700">
          Select a title below to begin browsing the regulations.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {titles.map(title => (
          <Link 
            key={title.id}
            href={`/browse${title.link}`}
            className="p-4 border rounded-md hover:bg-gray-50 transition-colors"
          >
            <div className="font-bold text-lg">{title.citation}</div>
            <div className="text-gray-600">{title.node_name}</div>
          </Link>
        ))}
      </div>
      
      <div className="mt-8 bg-gray-50 p-6 rounded-md">
        <h2 className="text-lg font-bold mb-2">About the CFR</h2>
        <p className="text-gray-700 mb-4">
          The CFR is divided into 50 titles that represent broad areas subject to Federal regulation. 
          Each title is divided into chapters, subchapters, parts, and sections. 
        </p>
        <p className="text-gray-700">
          This tool allows you to browse and search the CFR by title, chapter, part, or section.
        </p>
      </div>
    </div>
  );
} 