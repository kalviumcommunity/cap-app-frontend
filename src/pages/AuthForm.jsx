import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth.jsx';
import { VehicleIcon } from '../components/ui.jsx';

export default function AuthForm({ mode }) {
  const { login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ role: 'rider', vehicleType: 'car' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const reg = mode === 'register';
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api(`/auth/${mode}`, { method: 'POST', body: f });
      login(data);
      nav('/');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your details and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FAFAF7] text-[#14171A]">
      {/* Brand panel (desktop split screen) */}
      <div className="relative hidden w-1/2 flex-col justify-between border-r border-[#2B3036]/15 bg-[#14171A] p-12 text-[#FAFAF7] lg:flex">
        {/* Subtle decorative road markings */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 opacity-10">
          <div className="h-full w-full border-r-4 border-dashed border-[#FFC400]" />
        </div>

        <div>
          <div className="inline-flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2 border border-white/10">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFC400] text-xl">
              🚖
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              Cab App <span className="text-xs font-semibold text-[#FFC400] ml-1">Express</span>
            </span>
          </div>
        </div>

        <div className="max-w-md space-y-4">
          <span className="inline-block rounded-full bg-[#FFC400]/20 px-3 py-1 text-xs font-bold text-[#FFC400]">
            City transit system
          </span>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white leading-tight">
            Fast, metered, dependable cabs across your city.
          </h1>
          <p className="text-sm font-normal text-white/70 leading-relaxed">
            Connecting riders with cars, autos, and bikes in seconds. Transparent fares, live GPS tracking, and immediate driver dispatch.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
            <div className="space-y-1">
              <span className="block font-display text-xl font-bold text-[#FFC400]">3 mins</span>
              <span className="block text-xs text-white/60">Average pickup</span>
            </div>
            <div className="space-y-1">
              <span className="block font-display text-xl font-bold text-[#FFC400]">₹0</span>
              <span className="block text-xs text-white/60">Surge markups</span>
            </div>
            <div className="space-y-1">
              <span className="block font-display text-xl font-bold text-[#FFC400]">100%</span>
              <span className="block text-xs text-white/60">Live tracking</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-white/40">
          © {new Date().getFullYear()} Cab App Technologies · Local transit network
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2 md:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile brand header */}
          <div className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFC400] text-base">
              🚖
            </span>
            <span className="font-display text-base font-bold text-[#14171A]">Cab App</span>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-[#14171A]">
              {reg ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="mt-1 text-xs text-[#64748B]">
              {reg
                ? 'Sign up to start booking rides or accepting driver dispatches.'
                : 'Enter your credentials to access your dashboard.'}
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-[#D93025]/20 bg-[#D93025]/10 p-3.5 text-xs text-[#D93025]">
              <span className="text-sm font-bold">⚠️</span>
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {reg && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#14171A]">Full name</label>
                <input
                  className="field"
                  placeholder="e.g. Rahul Sharma"
                  required
                  onChange={set('name')}
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#14171A]">Email address</label>
              <input
                className="field"
                type="email"
                placeholder="name@example.com"
                required
                onChange={set('email')}
              />
            </div>

            {reg && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#14171A]">Phone number</label>
                <input
                  className="field"
                  placeholder="+91 98765 43210"
                  onChange={set('phone')}
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#14171A]">Password</label>
              <input
                className="field"
                type="password"
                placeholder="At least 6 characters"
                required
                onChange={set('password')}
              />
            </div>

            {reg && (
              <div className="space-y-4 pt-1">
                {/* Role segmented toggle */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#14171A]">Account role</label>
                  <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#2B3036]/20 bg-[#F4F4F1] p-1">
                    <button
                      type="button"
                      onClick={() => setF({ ...f, role: 'rider' })}
                      className={`flex items-center justify-center rounded-lg py-2 text-xs font-bold transition-all ${
                        f.role === 'rider'
                          ? 'bg-white text-[#14171A] shadow-sm'
                          : 'text-[#64748B] hover:text-[#14171A]'
                      }`}
                    >
                      I want to ride
                    </button>
                    <button
                      type="button"
                      onClick={() => setF({ ...f, role: 'driver' })}
                      className={`flex items-center justify-center rounded-lg py-2 text-xs font-bold transition-all ${
                        f.role === 'driver'
                          ? 'bg-[#14171A] text-[#FFC400] shadow-sm'
                          : 'text-[#64748B] hover:text-[#14171A]'
                      }`}
                    >
                      I want to drive
                    </button>
                  </div>
                </div>

                {f.role === 'driver' && (
                  <div className="space-y-3 rounded-2xl border border-[#FFC400]/40 bg-[#FFC400]/5 p-4">
                    <label className="block text-xs font-bold text-[#14171A]">
                      Select vehicle type
                    </label>

                    {/* Vehicle Segmented Control */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'bike', name: 'Bike' },
                        { id: 'auto', name: 'Auto' },
                        { id: 'car', name: 'Car' },
                      ].map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setF({ ...f, vehicleType: v.id })}
                          className={`flex flex-col items-center justify-center rounded-xl border p-2.5 transition-all ${
                            f.vehicleType === v.id
                              ? 'border-[#14171A] bg-white text-[#14171A] ring-2 ring-[#FFC400] shadow-sm'
                              : 'border-[#2B3036]/15 bg-white/70 text-[#64748B] hover:border-[#2B3036]/30'
                          }`}
                        >
                          <VehicleIcon type={v.id} className="h-6 w-6 mb-1" />
                          <span className="text-xs font-bold">{v.name}</span>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-[#14171A]">Vehicle model</label>
                        <input
                          className="field"
                          placeholder="e.g. Maruti Dzire"
                          onChange={set('vehicleModel')}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-[#14171A]">Number plate</label>
                        <input
                          className="field uppercase"
                          placeholder="TN 38 AA 1234"
                          onChange={set('plate')}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn w-full mt-2">
              {busy ? 'Processing…' : reg ? 'Create account' : 'Log in'}
            </button>
          </form>

          <p className="text-center text-xs text-[#64748B]">
            {reg ? (
              <span>
                Already have an account?{' '}
                <Link className="font-semibold text-[#14171A] underline underline-offset-2 hover:text-black" to="/">
                  Log in
                </Link>
              </span>
            ) : (
              <span>
                New to Cab App?{' '}
                <Link className="font-semibold text-[#14171A] underline underline-offset-2 hover:text-black" to="/register">
                  Create an account
                </Link>
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
