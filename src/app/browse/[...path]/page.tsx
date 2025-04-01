Create `src/app/browse/[...path]/page.tsx`:

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RegulationPageProps {
  params: {
    path: string[];
  };
}

export default function RegulationPage({ params }: RegulationPageProps) {
  // This would be fetched from the database based on the path
  const pathString = params.path.join("/");

  // Mock data - would come from your database
  const title = {
    number: "4",
    name: "Accounts",
    section: "Section 21-29",
    description: "General Procedures • Government Accountability Office"
  };

  const breadcrumbs = [
    { label: "Title 4", path: "/browse/title=4" },
    { label: "Chapter I", path: "/browse/title=4/chapter=I" },
    { label: "Subchapter B", path: "/browse/title=4/chapter=I/subchapter=B" },
    { label: "Sections 21-29", path: "/browse/title=4/chapter=I/subchapter=B/section=21-29" }
  ];

  const content = `
    <h2 class="text-xl font-semibold mt-6 mb-2">§ 21.1 Purpose.</h2>
    <p class="mb-4">This part sets forth the administrative procedures of the Government Accountability Office for the issuance, amendment, and revocation of regulations and for the formulation and publication of rules.</p>
    
    <h2 class="text-xl font-semibold mt-6 mb-2">§ 21.2 Definitions.</h2>
    <p class="mb-4">For purposes of this part:</p>
    <p class="mb-4">(a) Rule means the whole or a part of a statement of policy or interpretation or prescription of general application, designed to have general effect...</p>
  `;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumb navigation */}
      <div className="flex items-center mb-2 text-sm">
        {breadcrumbs.map((item, i) => (
          <div key={item.path} className="flex items-center">
            {i > 0 && <span className="mx-2">›</span>}
            <a href={item.path} className="text-blue-600 hover:underline">
              {item.label}
            </a>
          </div>
        ))}
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold mb-1">
        {breadcrumbs.map(b => b.label).join(' › ')}
      </h1>
      <p className="text-gray-600 mb-6">{title.description}</p>

      {/* Content tabs */}
      <Tabs defaultValue="content" className="w-full">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content">
          <div 
            className="prose prose-blue max-w-none mt-4" 
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </TabsContent>
        
        <TabsContent value="history">
          <div className="py-4">
            <p className="text-gray-600">
              Historical versions and amendments will be displayed here.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-md border">
                <h3 className="font-medium mb-2">Word Count</h3>
                <p className="text-2xl font-bold">347</p>
              </div>
              <div className="bg-white p-4 rounded-md border">
                <h3 className="font-medium mb-2">Citation Count</h3>
                <p className="text-2xl font-bold">12</p>
              </div>
              <div className="bg-white p-4 rounded-md border">
                <h3 className="font-medium mb-2">Last Updated</h3>
                <p className="text-2xl font-bold">Mar 2023</p>
              </div>
              <div className="bg-white p-4 rounded-md border">
                <h3 className="font-medium mb-2">Key Terms</h3>
                <div className="flex flex-wrap gap-1">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">rule</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">administrative</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">procedure</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}