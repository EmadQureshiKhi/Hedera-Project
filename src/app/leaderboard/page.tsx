import { Leaderboard } from '@/components/leaderboard/leaderboard';
import { Navbar } from '@/components/layout/navbar';

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Leaderboard />
      </div>
    </div>
  );
}