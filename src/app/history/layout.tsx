import { HistoryAnalyticsSidebar } from "@/components/layout/history-analytics-sidebar";

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
      <div className="w-96 border-l overflow-y-auto bg-gray-50 p-4">
        <HistoryAnalyticsSidebar />
      </div>
    </div>
  );
} 