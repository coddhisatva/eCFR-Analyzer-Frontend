"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const navItems = [
  { label: "Browse", href: "/browse" },
  { label: "Search", href: "/search" },
  { label: "Analytics", href: "/analytics" },
  { label: "History", href: "/history" },
  { label: "Chat", href: "/chat" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <div className="bg-blue-900 text-white py-2 px-4 flex items-center justify-between h-16">
      <div className="flex items-center space-x-2">
        <Link href="/" className="text-2xl font-bold">
          eCFR Analyzer
        </Link>
        
        <nav className="ml-8 hidden md:flex">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`px-5 py-2 rounded-md transition-colors ${
                pathname.startsWith(item.href) 
                  ? "bg-blue-800"
                  : "hover:bg-blue-800"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="relative w-80">
        <Input
          type="search"
          placeholder="Search regulations..."
          className="pr-10 bg-white text-black"
        />
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-0 top-0 h-full text-gray-500"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}