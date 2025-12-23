import { forwardRef } from 'react';
import { Home, Zap, Trophy, Calendar } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Zap, label: 'Live', path: '/live' },
  { icon: Trophy, label: 'Leagues', path: '/leagues' },
  { icon: Calendar, label: 'Fixtures', path: '/fixtures' },
];

export const BottomNav = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  (props, ref) => {
    const location = useLocation();
    const navigate = useNavigate();

    return (
      <nav ref={ref} className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border safe-area-pb" {...props}>
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={cn('nav-item', isActive && 'active')}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }
);

BottomNav.displayName = 'BottomNav';
