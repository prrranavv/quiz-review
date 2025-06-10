import React from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BookOpen } from 'lucide-react';

const Navigation: React.FC = () => {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Avatar className="h-8 w-8 mr-3">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <BookOpen className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-xl font-bold text-foreground">HQRL: Resources Curation</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 