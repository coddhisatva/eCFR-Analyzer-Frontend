import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default async function Page({
  params,
}: {
  params: Promise<{ path: string[] }>
}) {
  const { path } = await params;
  const pathString = path.join("/");
  console.log("Path:", pathString);

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
    <div className="max-w-4xl">
      {/* Breadcrumb navigation */}
      <div className="flex items-center mb-2 text-sm">
        {breadcrumbs.map((item, i) => (
          <div key={item.path} className="flex items-center">
            {i > 0 && <span className="mx-2">›</span>}
            <Link href={item.path} className="text-blue-600 hover:underline">
              {item.label}
            </Link>
          </div>
        ))}
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold mb-1">
        {breadcrumbs.map(b => b.label).join(' › ')}
      </h1>
      <p className="text-gray-600 mb-6">{title.description}</p>

      {/* Content tabs - now just content and history */}
      <Tabs defaultValue="content" className="w-full">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
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
            <div className="mt-4">
              <h3 className="font-medium mb-2">Version History</h3>
              <div className="border rounded-md">
                <div className="grid grid-cols-3 p-3 border-b bg-gray-50 font-medium">
                  <div>Date</div>
                  <div>Change Type</div>
                  <div>Description</div>
                </div>
                <div className="grid grid-cols-3 p-3 border-b">
                  <div>Mar 12, 2023</div>
                  <div>Amendment</div>
                  <div>Updated definition in § 21.2(a)</div>
                </div>
                <div className="grid grid-cols-3 p-3 border-b">
                  <div>Jan 5, 2022</div>
                  <div>Revision</div>
                  <div>Added clarity to purpose statement</div>
                </div>
                <div className="grid grid-cols-3 p-3">
                  <div>Nov 20, 2020</div>
                  <div>Initial</div>
                  <div>Original publication</div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}