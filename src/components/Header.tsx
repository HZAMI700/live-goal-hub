import { Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title?: string;
}

export const Header = ({ title = 'LiveScore' }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 glass border-b border-border">
      <div className="container flex items-center justify-between h-14 px-4">
        <h1 className="text-xl font-bold text-gradient">{title}</h1>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-live rounded-full" />
          </Button>
        </div>
      </div>
    </header>
  );
};
