import { useEffect, useState } from 'react';
import { api, fmt } from '../api';
import { useAuth } from '../auth.jsx';
import { getSocket } from '../socket';
import MapView from '../components/MapView.jsx';
import { Badge, StatusStepper, TYPES, VehicleIcon } from '../components/ui.jsx';

const ADVANCE = {
  accepted: 'I have arrived at pickup',
  arrived: 'Start ride with passenger',
  in_progress: 'Complete ride & collect fare',
};

export default function DriverHome() {
  const { user, setUser } = useAuth();
  const [lng0, lat0] = (user.location && user.location.coordinates) || [0, 0];
  const [loc, setLoc] = useState(lat0 || lng0 ? { lat: lat0, lng: lng0 } : null);
  const [requests, setRequests] = useState([]);
  const [ride, setRide] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const online = user.isOnline;

  const loadRequests = () => api('/rides/requests').then(setRequests).catch(() => {});

  useEffect(() => {
    api('/rides/active').then(setRide).catch(() => {});
    const s = getSocket();
    const onReq = (r) => setRequests((x) => [r, ...x.filter((y) => y._id !== r._id)]);
    const onGone = ({ id }) => setRequests((x) => x.filter((y) => y._id !== id));
    const onUpdate = (r) => setRide(r);
    s.on('ride:request', onReq);
    s.on('ride:gone', onGone);
    s.on('ride:update', onUpdate);
    return () => {
      s.off('ride:request', onReq);
      s.off('ride:gone', onGone);
      s.off('ride:update', onUpdate);
    };
  }, []);

  // While online, send my position every 5 seconds (riders on my ride see it live)
  useEffect(() => {
    if (!online || !loc) return;
    const s = getSocket();
    s.emit('driver:location', loc);
    const t = setInterval(() => s.emit('driver:location', loc), 5000);
    return () => clearInterval(t);
  }, [online, loc]);

  useEffect(() => {
    if (online && !ride) loadRequests();
  }, [online, ride && ride._id]);

  const move = (p) => {
    setLoc(p);
    if (online) getSocket().emit('driver:location', p, loadRequests);
  };

  const useGps = () =>
    navigator.geolocation.getCurrentPosition(
      (pos) => move({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setMsg('GPS unavailable. Click the map to set your location instead.')
    );

  const toggle = async () => {
    setMsg('');
    setBusy(true);
    try {
      const u = await api('/driver/online', { method: 'POST', body: { online: !online, ...loc } });
      setUser(u);
      if (!u.isOnline) setRequests([]);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const run = async (fn) => {
    setMsg('');
    try {
      await fn();
    } catch (e) {
      setMsg(e.message);
      loadRequests();
    }
  };

  const accept = (id) =>
    run(async () => {
      const r = await api(`/rides/${id}/accept`, { method: 'POST' });
      setRide(r);
      setRequests([]);
    });

  const advance = () =>
    run(async () => {
      const r = await api(`/rides/${ride._id}/advance`, { method: 'POST' });
      setRide(r);
    });

  const cancel = () =>
    run(async () => {
      const r = await api(`/rides/${ride._id}/cancel`, { method: 'POST' });
      setRide(r);
    });

  const markers = [
    loc && { ...loc, label: 'You', color: '#14171A', vehicleType: user.vehicleType },
    ...(ride
      ? [
          { ...ride.pickup, label: 'Pickup', color: '#16a34a' },
          { ...ride.drop, label: 'Drop', color: '#dc2626' },
        ]
      : requests.map((r, i) => ({ ...r.pickup, label: `Request ${i + 1}`, color: '#FFC400' }))),
  ].filter(Boolean);

  return (
    <div className="relative h-[calc(100vh-56px)] w-full overflow-hidden bg-[#14171A]">
      {/* Map display */}
      <MapView
        markers={markers}
        onClick={move}
        height="100%"
        vehicleType={user.vehicleType}
      />

      {/* Driver Cockpit Panel (Desktop left / Mobile bottom sheet) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col md:inset-y-0 md:left-4 md:right-auto md:w-[420px] md:justify-center md:py-4">
        <div className="pointer-events-auto flex max-h-[85vh] w-full flex-col overflow-y-auto rounded-t-3xl border border-[#2B3036] bg-[#14171A] p-5 text-[#FAFAF7] shadow-2xl md:max-h-full md:rounded-2xl">
          {/* Bold Online / Offline Switch Header */}
          <div className="mb-4 space-y-3 rounded-2xl border border-white/10 bg-[#2B3036]/60 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-3 w-3 rounded-full ${
                    online ? 'bg-[#16A34A] ring-4 ring-[#16A34A]/30 animate-pulse' : 'bg-[#D93025]'
                  }`}
                />
                <div>
                  <h2 className="font-display text-sm font-bold tracking-tight text-white">
                    {online ? 'Online & Receiving Dispatches' : 'Offline'}
                  </h2>
                  <p className="text-[11px] text-white/60">
                    {online ? 'Active within 5 km radius' : 'Switch online to accept trips'}
                  </p>
                </div>
              </div>

              <button
                disabled={busy}
                onClick={toggle}
                className={`min-h-[38px] rounded-xl px-4 text-xs font-display font-bold transition-all ${
                  online
                    ? 'border border-white/20 bg-white/10 text-white hover:bg-white/20'
                    : 'bg-[#FFC400] text-[#14171A] hover:bg-[#EBB500] shadow-md'
                }`}
              >
                {busy ? 'Updating…' : online ? 'Go offline' : 'Go online'}
              </button>
            </div>

            {/* Driver Earnings & Profile Summary Strip */}
            <div className="flex items-center justify-between border-t border-white/10 pt-2.5 text-xs">
              <div className="flex items-center gap-1.5">
                <VehicleIcon type={user.vehicleType} className="h-4 w-4 text-[#FFC400]" />
                <span className="font-semibold text-white/90">{TYPES[user.vehicleType]}</span>
                <span className="text-white/40">·</span>
                <span className="font-mono text-white/70">{user.plate || 'No plate'}</span>
              </div>
              <div className="flex items-center gap-1 text-[#FFC400] font-bold">
                <span>★</span>
                <span>{user.ratingCount ? user.ratingAvg.toFixed(1) : 'New driver'}</span>
              </div>
            </div>
          </div>

          {msg && (
            <div className="mb-3 rounded-xl border border-[#FFC400]/40 bg-[#FFC400]/15 p-3 text-xs text-[#FFC400]">
              {msg}
            </div>
          )}

          {/* Active Ride Cockpit */}
          {ride ? (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white p-4 text-[#14171A]">
              <div className="flex items-center justify-between border-b border-[#2B3036]/10 pb-2">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-[#64748B]">Active Job</span>
                <Badge status={ride.status} />
              </div>

              {/* Status Stepper */}
              <StatusStepper status={ride.status} />

              {/* Rider Details */}
              <div className="flex items-center justify-between rounded-xl bg-[#FAFAF7] p-3 border border-[#2B3036]/10">
                <div>
                  <span className="block text-xs font-bold text-[#14171A]">{ride.rider.name}</span>
                  <span className="block text-[11px] text-[#64748B]">Passenger</span>
                </div>
                {ride.rider.phone && (
                  <a
                    href={`tel:${ride.rider.phone}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFC400] text-sm text-[#14171A]"
                    title="Call passenger"
                  >
                    📞
                  </a>
                )}
              </div>

              {/* Route & Fare Callout */}
              <div className="space-y-2 rounded-xl border border-[#2B3036]/10 p-3 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-[#16A34A] font-bold">●</span>
                  <span className="font-medium">{ride.pickupAddress || 'Pickup location'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#D93025] font-bold">■</span>
                  <span className="font-medium">{ride.dropAddress || 'Drop destination'}</span>
                </div>
                <div className="flex items-center justify-between border-t border-[#2B3036]/10 pt-2">
                  <span className="text-[#64748B]">Expected earnings</span>
                  <span className="font-display text-lg font-extrabold text-[#16A34A]">{fmt(ride.fare)}</span>
                </div>
              </div>

              {/* Advance action button */}
              {ADVANCE[ride.status] && (
                <button className="btn w-full py-3 text-sm shadow-md" onClick={advance}>
                  {ADVANCE[ride.status]}
                </button>
              )}

              {/* Completion notice */}
              {ride.status === 'completed' && (
                <div className="rounded-xl bg-[#16A34A]/10 p-3 text-center">
                  <p className="font-display text-xs font-bold text-[#16A34A]">
                    Trip complete · {fmt(ride.fare)} added to your earnings
                  </p>
                </div>
              )}

              {/* Secondary cancel */}
              {['accepted', 'arrived'].includes(ride.status) && (
                <div className="text-center">
                  <button className="text-xs font-semibold text-[#D93025] hover:underline" onClick={cancel}>
                    Cancel this trip
                  </button>
                </div>
              )}

              {['completed', 'cancelled'].includes(ride.status) && (
                <button className="btn-ghost w-full text-xs" onClick={() => setRide(null)}>
                  Return to dispatch requests
                </button>
              )}
            </div>
          ) : (
            /* Incoming Requests List */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-white/70">
                  Nearby requests ({requests.length})
                </h3>
                <button
                  type="button"
                  onClick={useGps}
                  className="text-[11px] font-semibold text-[#FFC400] hover:underline"
                >
                  Update GPS location
                </button>
              </div>

              {!online && (
                <div className="rounded-2xl border border-white/10 bg-[#2B3036]/40 p-6 text-center">
                  <span className="block text-2xl mb-1">🛑</span>
                  <h4 className="font-display text-sm font-bold text-white">You are currently offline</h4>
                  <p className="mt-1 text-xs text-white/60">
                    Press &quot;Go online&quot; above to start receiving ride requests within 5 km.
                  </p>
                </div>
              )}

              {online && requests.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-[#2B3036]/40 p-6 text-center">
                  <span className="block text-2xl mb-1 animate-pulse">📡</span>
                  <h4 className="font-display text-sm font-bold text-white">Waiting for rides nearby</h4>
                  <p className="mt-1 text-xs text-white/60">
                    Stay positioned in active transit zones. New requests will chime and appear instantly.
                  </p>
                </div>
              )}

              {requests.map((r, i) => (
                <div
                  key={r._id}
                  className="rounded-2xl border border-white/15 bg-white p-4 text-[#14171A] shadow-md transition-all hover:border-[#FFC400]"
                >
                  <div className="flex items-center justify-between border-b border-[#2B3036]/10 pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FFC400] text-[11px] font-extrabold text-[#14171A]">
                        {i + 1}
                      </span>
                      <span className="font-display text-xs font-bold text-[#14171A]">Rapid dispatch</span>
                    </div>
                    <span className="font-display text-lg font-extrabold text-[#14171A]">{fmt(r.fare)}</span>
                  </div>

                  <div className="my-2.5 space-y-1.5 text-xs text-[#14171A]">
                    <div className="flex items-start gap-2">
                      <span className="text-[#16A34A] font-bold">●</span>
                      <span className="font-medium truncate">{r.pickupAddress || 'Pickup point'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#D93025] font-bold">■</span>
                      <span className="font-medium truncate">{r.dropAddress || 'Destination point'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#2B3036]/10 pt-2 text-[11px] text-[#64748B]">
                    <span>Distance: <b className="text-[#14171A]">{r.distanceKm} km</b></span>
                    <span>Direct payout</span>
                  </div>

                  <button
                    className="btn w-full mt-3 py-3 text-sm font-display font-extrabold shadow"
                    onClick={() => accept(r._id)}
                  >
                    Accept ride · {fmt(r.fare)}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quick tester hint */}
          <p className="mt-4 text-center text-[11px] text-white/40">
            Click anywhere on the map to reposition vehicle while testing.
          </p>
        </div>
      </div>
    </div>
  );
}
