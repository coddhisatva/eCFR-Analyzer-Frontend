import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

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
    </div>
  );
}