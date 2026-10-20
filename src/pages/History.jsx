import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt } from '../api';
import { useAuth } from '../auth.jsx';
import { Badge, Stars, TYPES, VehicleIcon } from '../components/ui.jsx';

export default function History() {
  const { user } = useAuth();
  const [rides, setRides] = useState(null);
  const [msg, setMsg] = useState('');
  const [busyId, setBusyId] = useState(null);
  const isRider = user.role === 'rider';

  const load = () => api('/rides/mine').then(setRides).catch((e) => setMsg(e.message));

  // Stripe sends the rider back here with ?session_id=... after paying
  useEffect(() => {
    const sid = new URLSearchParams(window.location.search).get('session_id');
    if (!sid) {
      load();
      return;
    }
    window.history.replaceState({}, '', '/history');
    api('/payments/confirm', { method: 'POST', body: { sessionId: sid } })
      .then((r) => setMsg(r.paid ? 'Payment received. Thank you!' : 'The payment was not completed.'))
      .catch((e) => setMsg(e.message))
      .finally(load);
  }, []);

  const pay = (id) => {
    setBusyId(id);
    api(`/payments/checkout/${id}`, { method: 'POST' })
      .then((r) => {
        window.location.href = r.url;
      })
      .catch((e) => {
        setMsg(e.message);
        setBusyId(null);
      });
  };

  const rate = (id, rating) =>
    api(`/rides/${id}/rate`, { method: 'POST', body: { rating } })
      .then(load)
      .catch((e) => setMsg(e.message));

  const done = (rides || []).filter((r) => r.status === 'completed');
  const total = done.reduce((sum, r) => sum + r.fare, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#14171A]">
          {isRider ? 'My rides & trips' : 'Trips & driver earnings'}
        </h1>
        <p className="mt-1 text-xs text-[#64748B]">
          Complete log of past dispatches, payments, and digital receipts.
        </p>
      </div>

      {/* Summary Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[#2B3036]/10 bg-white p-4 shadow-sm">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            {isRider ? 'Total spent' : 'Total earnings'}
          </span>
          <span className="mt-1 block font-display text-2xl font-extrabold text-[#14171A]">
            {fmt(total)}
          </span>
        </div>

        <div className="rounded-2xl border border-[#2B3036]/10 bg-white p-4 shadow-sm">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            Completed trips
          </span>
          <span className="mt-1 block font-display text-2xl font-extrabold text-[#14171A]">
            {done.length}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-[#2B3036]/10 bg-white p-4 shadow-sm">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            Account role
          </span>
          <span className="mt-1 block font-display text-lg font-bold capitalize text-[#14171A]">
            {user.role} · {user.vehicleType ? TYPES[user.vehicleType] : 'City passenger'}
          </span>
        </div>
      </div>

      {msg && (
        <div className="rounded-xl border border-[#FFC400]/40 bg-[#FFC400]/15 p-3.5 text-xs font-semibold text-[#14171A]">
          {msg}
        </div>
      )}

      {/* Empty State */}
      {rides && rides.length === 0 && (
        <div className="rounded-2xl border border-[#2B3036]/10 bg-white p-8 text-center space-y-3 shadow-sm">
          <span className="text-3xl block">📋</span>
          <h3 className="font-display text-base font-bold text-[#14171A]">No ride history found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            {isRider
              ? 'You have not booked any rides yet. Set your pickup and destination on the map to get started.'
              : 'You have not completed any driver trips yet. Switch online from your cockpit to receive requests.'}
          </p>
          <Link to="/" className="btn inline-flex text-xs mt-2">
            {isRider ? 'Book a ride now' : 'Go to driver cockpit'}
          </Link>
        </div>
      )}

      {/* Trip List */}
      <div className="space-y-3">
        {(rides || []).map((r) => {
          const isDone = r.status === 'completed';
          return (
            <div
              key={r._id}
              className="card transition-all hover:border-[#2B3036]/30 hover:shadow-md space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2B3036]/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FAFAF7] text-[#14171A] border border-[#2B3036]/10">
                    <VehicleIcon type={r.type} className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="font-display text-xs font-bold text-[#14171A]">{TYPES[r.type]} ride</span>
                    <span className="block text-[11px] text-[#64748B]">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-display text-lg font-extrabold text-[#14171A] tabular-nums">
                    {fmt(r.fare)}
                  </span>
                  <Badge status={r.status} />
                </div>
              </div>

              {/* Route line display */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-[#16A34A] font-bold mt-0.5">●</span>
                  <span className="text-[#14171A] font-medium">{r.pickupAddress || 'Pickup point'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#D93025] font-bold mt-0.5">■</span>
                  <span className="text-[#14171A] font-medium">{r.dropAddress || 'Destination point'}</span>
                </div>
              </div>

              {/* Metadata and Quick Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#2B3036]/10 pt-2.5 text-xs">
                <div className="flex items-center gap-3 text-[#64748B]">
                  <span>{r.distanceKm} km transit</span>
                  {isDone && (
                    <span
                      className={`font-semibold ${
                        r.paymentStatus === 'paid' ? 'text-[#16A34A]' : 'text-[#D93025]'
                      }`}
                    >
                      {r.paymentStatus === 'paid' ? 'Paid by card' : 'Payment pending'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isDone && isRider && r.paymentStatus !== 'paid' && (
                    <button
                      className="btn py-1.5 px-3 text-xs"
                      disabled={busyId === r._id}
                      onClick={() => pay(r._id)}
                    >
                      {busyId === r._id ? 'Redirecting…' : 'Pay fare'}
                    </button>
                  )}

                  {isDone && (
                    <Link
                      to={`/receipt/${r._id}`}
                      className="btn-ghost py-1.5 px-3 text-xs"
                    >
                      View receipt
                    </Link>
                  )}
                </div>
              </div>

              {/* Rating Section */}
              {isDone && (
                <div className="flex items-center justify-between border-t border-dashed border-[#2B3036]/10 pt-2 text-xs">
                  <span className="text-[#64748B]">Driver rating</span>
                  {r.rating ? (
                    <Stars value={r.rating} />
                  ) : isRider ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#64748B]">Tap to rate:</span>
                      <Stars value={0} onPick={(n) => rate(r._id, n)} />
                    </div>
                  ) : (
                    <span className="text-[#64748B] italic">Not rated yet</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
