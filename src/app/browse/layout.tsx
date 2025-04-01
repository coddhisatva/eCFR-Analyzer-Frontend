import { AnalyticsSidebar } from "@/components/layout/analytics-sidebar";

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
      <div className="w-72 border-l overflow-y-auto bg-gray-50 p-4">
        <AnalyticsSidebar />
      </div>
    </div>
  );
}