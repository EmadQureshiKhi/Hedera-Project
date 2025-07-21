import { Dashboard } from '@/components/dashboard/dashboard';
import { Navbar } from '@/components/layout/navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Navbar />
      <Dashboard />
    </div>
  );
}