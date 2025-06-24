import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Navigation: React.FC = () => {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 mr-3 relative">
                <Image
                  src="/books.png"
                  alt="HQRL Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold text-foreground">HQRL Resources</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/analytics" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Analytics
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 