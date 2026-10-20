import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import AuthForm from './pages/AuthForm.jsx';
import RiderHome from './pages/RiderHome.jsx';
import DriverHome from './pages/DriverHome.jsx';
import History from './pages/History.jsx';
import Receipt from './pages/Receipt.jsx';

export default function App() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAF7] text-[#14171A]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFC400] text-[#14171A] font-display font-extrabold shadow-sm">
            C
          </span>
          <span className="font-display text-lg font-bold tracking-tight">Cab App</span>
        </div>
        <p className="mt-4 text-xs font-medium text-[#64748B]">Connecting to rapid city dispatch…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/register" element={<AuthForm mode="register" />} />
        <Route path="*" element={<AuthForm mode="login" />} />
      </Routes>
    );
  }

  const isHome = location.pathname === '/';
  const isHistory = location.pathname.startsWith('/history');
  const isDriver = user.role === 'driver';

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF7] text-[#14171A]">
      {/* Desktop & Mobile Top Header */}
      <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-[#2B3036]/10 bg-[#14171A] px-4 text-[#FAFAF7] shadow-sm md:px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC400]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFC400] font-display text-base font-extrabold text-[#14171A]">
              🚖
            </span>
            <span className="font-display text-base font-bold tracking-tight text-[#FAFAF7]">
              Cab App <span className="text-[11px] font-semibold text-[#FFC400] bg-[#FFC400]/15 px-1.5 py-0.5 rounded ml-1">Express</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1.5 md:flex">
            <Link
              to="/"
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC400] ${
                isHome ? 'bg-[#2B3036] text-[#FFC400]' : 'text-[#FAFAF7]/70 hover:bg-[#2B3036]/60 hover:text-white'
              }`}
            >
              {isDriver ? 'Driver cockpit' : 'Book a ride'}
            </Link>
            <Link
              to="/history"
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC400] ${
                isHistory ? 'bg-[#2B3036] text-[#FFC400]' : 'text-[#FAFAF7]/70 hover:bg-[#2B3036]/60 hover:text-white'
              }`}
            >
              {isDriver ? 'Trips & earnings' : 'My rides'}
            </Link>
          </nav>
        </div>

        {/* User profile & session controls */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 border-r border-[#2B3036] pr-3 text-xs sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
            <span className="font-semibold text-[#FAFAF7]">{user.name}</span>
            <span className="rounded bg-[#2B3036] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#FFC400]">
              {user.role}
            </span>
          </div>

          <button
            onClick={logout}
            className="flex min-h-[36px] items-center justify-center rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/90 transition-all hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC400]"
          >
            Log out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={isDriver ? <DriverHome /> : <RiderHome />} />
          <Route path="/history" element={<History />} />
          <Route path="/receipt/:id" element={<Receipt />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-14 items-center justify-around border-t border-[#2B3036]/15 bg-[#14171A] text-white shadow-lg md:hidden">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center gap-0.5 px-4 py-1 text-[11px] font-semibold transition-colors ${
            isHome ? 'text-[#FFC400]' : 'text-white/60 hover:text-white'
          }`}
        >
          <span className="text-base">🚖</span>
          <span>{isDriver ? 'Cockpit' : 'Book'}</span>
        </Link>
        <Link
          to="/history"
          className={`flex flex-col items-center justify-center gap-0.5 px-4 py-1 text-[11px] font-semibold transition-colors ${
            isHistory ? 'text-[#FFC400]' : 'text-white/60 hover:text-white'
          }`}
        >
          <span className="text-base">📋</span>
          <span>{isDriver ? 'Earnings' : 'Trips'}</span>
        </Link>
        <div className="flex flex-col items-center justify-center gap-0.5 px-4 py-1 text-[11px] text-white/50">
          <span className="text-base">👤</span>
          <span className="truncate max-w-[60px]">{user.name.split(' ')[0]}</span>
        </div>
      </nav>
    </div>
  );
}
