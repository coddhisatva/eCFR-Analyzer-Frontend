"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Search", href: "/" },
  { label: "Analytics", href: "/analytics" },
  { label: "History", href: "/history" },
  { label: "Agency View", href: "/agency" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <div className="bg-blue-900 text-white py-2 px-4 flex items-center justify-between h-16">
      <div className="flex items-center space-x-8">
        <Link href="/" className="text-2xl font-bold hover:opacity-90 transition-opacity">
          eCFR Analyzer
        </Link>
        
        <nav className="hidden md:flex">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`px-5 py-2 rounded-md transition-colors ${
                pathname === item.href 
                  ? "bg-blue-800"
                  : "hover:bg-blue-800"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}