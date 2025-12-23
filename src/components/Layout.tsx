import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export const Layout = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-lg mx-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};
