import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, distKm, fmt, getRoute, reverseGeocode } from '../api';
import { getSocket } from '../socket';
import MapView from '../components/MapView.jsx';
import { Badge, Stars, StatusStepper, TYPES, VehicleIcon, VEHICLE_DETAILS } from '../components/ui.jsx';

export default function RiderHome() {
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [addr, setAddr] = useState({});
  const [est, setEst] = useState(null);
  const [type, setType] = useState('car');
  const [route, setRoute] = useState(null);
  const [ride, setRide] = useState(null);
  const [driverLoc, setDriverLoc] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [stars, setStars] = useState(5);
  const [review, setReview] = useState('');

  // Pick up an in-progress ride after a refresh + listen for live updates
  useEffect(() => {
    api('/rides/active').then(setRide).catch(() => {});
    const s = getSocket();
    const onUpdate = (r) => setRide(r);
    const onLoc = (p) => setDriverLoc(p);
    s.on('ride:update', onUpdate);
    s.on('driver:location', onLoc);
    return () => {
      s.off('ride:update', onUpdate);
      s.off('driver:location', onLoc);
    };
  }, []);

  const a = ride ? ride.pickup : pickup;
  const b = ride ? ride.drop : drop;

  // Route line + fare estimate whenever the two points change
  useEffect(() => {
    setEst(null);
    setRoute(null);
    if (!a || !b) return;
    getRoute(a, b).then(setRoute);
    if (!ride) {
      api('/rides/estimate', { method: 'POST', body: { pickup: a, drop: b } })
        .then(setEst)
        .catch((e) => setMsg(e.message));
    }
  }, [pickup, drop, ride && ride._id]);

  const place = (kind, p) => {
    if (kind === 'pickup') setPickup(p);
    else setDrop(p);
    reverseGeocode(p).then((text) => setAddr((x) => ({ ...x, [kind]: text })));
  };

  const onMap = (p) => {
    if (!ride) place(pickup ? 'drop' : 'pickup', p);
  };

  const locateMe = () =>
    navigator.geolocation.getCurrentPosition(
      (pos) => place('pickup', { lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setMsg('Could not read your location. Click the map instead.')
    );

  const act = async (fn) => {
    setMsg('');
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const book = () =>
    act(async () => {
      const r = await api('/rides', {
        method: 'POST',
        body: { pickup, drop, type, pickupAddress: addr.pickup, dropAddress: addr.drop },
      });
      setRide(r.ride);
      setDriverLoc(null);
      if (!r.driversNotified) {
        setMsg(`No ${TYPES[type].toLowerCase()} drivers are online near you yet. Your request stays open.`);
      }
    });

  const cancel = () =>
    act(async () => {
      const res = await api(`/rides/${ride._id}/cancel`, { method: 'POST' });
      setRide(res);
    });

  const pay = () =>
    act(async () => {
      const { url } = await api(`/payments/checkout/${ride._id}`, { method: 'POST' });
      window.location.href = url;
    });

  const rate = () =>
    act(async () => {
      const res = await api(`/rides/${ride._id}/rate`, { method: 'POST', body: { rating: stars, review } });
      setRide(res);
    });

  const reset = () => {
    setRide(null);
    setPickup(null);
    setDrop(null);
    setAddr({});
    setDriverLoc(null);
    setMsg('');
  };

  const live = ride && ['accepted', 'arrived', 'in_progress'].includes(ride.status);
  const target = ride && ride.status === 'in_progress' ? ride.drop : ride && ride.pickup;
  const eta = live && driverLoc && ride.status !== 'arrived'
    ? Math.max(1, Math.round((distKm(driverLoc, target) / 25) * 60))
    : null;

  const isSearching = ride && ride.status === 'requested';

  const markers = [
    a && { ...a, label: 'Pickup', color: '#16a34a' },
    b && { ...b, label: 'Drop', color: '#dc2626' },
    live && driverLoc && { ...driverLoc, label: 'Driver', color: '#14171A', vehicleType: ride?.type },
  ].filter(Boolean);

  return (
    <div className="relative h-[calc(100vh-56px)] w-full overflow-hidden bg-[#FAFAF7]">
      {/* Full-bleed interactive map */}
      <MapView
        markers={markers}
        line={route}
        onClick={onMap}
        height="100%"
        isSearching={isSearching}
        vehicleType={ride ? ride.type : type}
      />

      {/* Floating Panel: Desktop left floating card / Mobile bottom sheet */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col md:inset-y-0 md:left-4 md:right-auto md:w-[420px] md:justify-center md:py-4">
        <div className="pointer-events-auto flex max-h-[85vh] w-full flex-col overflow-y-auto rounded-t-3xl border border-[#2B3036]/15 bg-white p-5 shadow-2xl md:max-h-full md:rounded-2xl">
          {msg && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-[#FFC400]/40 bg-[#FFC400]/15 p-3 text-xs font-semibold text-[#14171A]">
              <span>ℹ️</span>
              <span className="flex-1 leading-relaxed">{msg}</span>
            </div>
          )}

          {!ride ? (
            <div className="space-y-4">
              {/* Header and Step Indicator */}
              <div className="flex items-center justify-between border-b border-[#2B3036]/10 pb-3">
                <div>
                  <h1 className="font-display text-lg font-bold text-[#14171A]">Book a city ride</h1>
                  <p className="text-xs text-[#64748B]">
                    {!pickup
                      ? 'Step 1: Set your pickup point'
                      : !drop
                      ? 'Step 2: Set your destination'
                      : 'Route ready · Choose your vehicle'}
                  </p>
                </div>
                {pickup && (
                  <button
                    onClick={reset}
                    className="text-xs font-semibold text-[#64748B] hover:text-[#14171A] hover:underline"
                  >
                    Clear route
                  </button>
                )}
              </div>

              {/* Connected Pickup & Drop Route Pair */}
              <div className="relative rounded-2xl border border-[#2B3036]/15 bg-[#FAFAF7] p-3.5">
                {/* Connecting Transit Line */}
                <div className="absolute left-[26px] top-[26px] bottom-[26px] w-0.5 bg-[#2B3036]/20" />

                <div className="space-y-3">
                  {/* Pickup Row */}
                  <div className="flex items-start gap-3">
                    <span className="relative z-10 mt-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-[#16A34A] ring-2 ring-[#16A34A]/20" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A]">Pickup</span>
                        {!pickup && (
                          <button
                            type="button"
                            onClick={locateMe}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#14171A] hover:underline"
                          >
                            <span>📍</span> Locate me
                          </button>
                        )}
                      </div>
                      <p className="text-xs font-medium text-[#14171A] mt-0.5">
                        {addr.pickup || (pickup ? 'Selected on map' : 'Click the map to select pickup')}
                      </p>
                    </div>
                  </div>

                  {/* Drop-off Row */}
                  <div className="flex items-start gap-3 border-t border-[#2B3036]/10 pt-2.5">
                    <span className="relative z-10 mt-1 flex h-4 w-4 items-center justify-center rounded-sm border-2 border-white bg-[#D93025] ring-2 ring-[#D93025]/20" />
                    <div className="flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#D93025]">Drop-off</span>
                      <p className="text-xs font-medium text-[#14171A] mt-0.5">
                        {addr.drop || (drop ? 'Selected on map' : pickup ? 'Now click destination on map' : 'Choose pickup first')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick instructions pill when route is empty */}
              {!pickup && (
                <button
                  onClick={locateMe}
                  className="btn-ghost w-full gap-2 text-xs"
                >
                  <span>📍</span> Use my current location for pickup
                </button>
              )}

              {/* Fare Estimates & Vehicle Selection */}
              {est && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs text-[#64748B]">
                    <span>Distance & Route</span>
                    <span className="font-semibold text-[#14171A]">~{est.distanceKm} km transit</span>
                  </div>

                  {/* Rich Selectable Vehicle Rows */}
                  <div className="space-y-2">
                    {Object.keys(TYPES).map((t) => {
                      const isSelected = type === t;
                      const detail = VEHICLE_DETAILS[t] || {};
                      const fare = est.fares[t];
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setType(t)}
                          className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                            isSelected
                              ? 'border-[#14171A] bg-[#FFC400]/10 ring-2 ring-[#14171A]'
                              : 'border-[#2B3036]/15 bg-white hover:border-[#2B3036]/40 hover:bg-[#FAFAF7]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                isSelected ? 'bg-[#FFC400] text-[#14171A]' : 'bg-[#F4F4F1] text-[#2B3036]'
                              }`}
                            >
                              <VehicleIcon type={t} className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-display text-sm font-bold text-[#14171A]">{TYPES[t]}</span>
                                <span className="text-[11px] text-[#64748B]">· {detail.capacity}</span>
                              </div>
                              <span className="block text-[11px] text-[#64748B]">{detail.tag}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="block font-display text-base font-extrabold text-[#14171A]">
                              {fmt(fare)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Single Most Prominent Element: Book Button */}
                  <button
                    className="btn w-full py-3.5 text-base shadow-md font-display"
                    disabled={busy}
                    onClick={book}
                  >
                    {busy ? 'Requesting ride…' : `Book ${TYPES[type]} for ${fmt(est.fares[type])}`}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Live Ride Status Card */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#2B3036]/10 pb-3">
                <span className="font-display text-sm font-bold text-[#14171A]">Active trip</span>
                <Badge status={ride.status} />
              </div>

              {/* Status Stepper */}
              <StatusStepper status={ride.status} />

              {/* Searching State Animation */}
              {ride.status === 'requested' && (
                <div className="flex items-center gap-3 rounded-xl border border-[#FFC400]/40 bg-[#FFC400]/10 p-3.5">
                  <div className="relative flex h-8 w-8 items-center justify-center">
                    <span className="radar-pulse-ring" />
                    <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#14171A] text-xs text-[#FFC400]">
                      🚖
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#14171A]">Broadcasting request</h3>
                    <p className="text-[11px] text-[#64748B]">Alerting verified drivers nearby…</p>
                  </div>
                </div>
              )}

              {/* Large ETA Callout */}
              {eta && (
                <div className="flex items-center justify-between rounded-xl border border-[#2B3036]/15 bg-[#14171A] p-4 text-[#FAFAF7]">
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-[#FFC400] font-semibold">
                      Estimated arrival
                    </span>
                    <span className="text-xs text-white/60">Driver is approaching pickup</span>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-3xl font-extrabold text-white">~{eta}</span>
                    <span className="ml-1 text-sm font-semibold text-[#FFC400]">min</span>
                  </div>
                </div>
              )}

              {/* Driver Profile Row */}
              {ride.driver && (
                <div className="rounded-xl border border-[#2B3036]/15 bg-[#FAFAF7] p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#14171A] text-white">
                        <VehicleIcon type={ride.type} className="h-6 w-6 text-[#FFC400]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-display text-sm font-bold text-[#14171A]">{ride.driver.name}</span>
                          <span className="inline-flex items-center gap-0.5 rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-bold text-[#14171A]">
                            ★ {ride.driver.ratingAvg ? ride.driver.ratingAvg.toFixed(1) : 'New'}
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B]">
                          {ride.driver.vehicleModel} · <span className="font-bold text-[#14171A]">{ride.driver.plate}</span>
                        </p>
                      </div>
                    </div>
                    {ride.driver.phone && (
                      <a
                        href={`tel:${ride.driver.phone}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2B3036]/20 bg-white text-base hover:bg-black/5"
                        title="Call driver"
                      >
                        📞
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Trip Route Summary */}
              <div className="rounded-xl border border-[#2B3036]/10 p-3 text-xs space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-[#16A34A] font-bold">●</span>
                  <span className="text-[#14171A] font-medium">{ride.pickupAddress || 'Pickup location'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#D93025] font-bold">■</span>
                  <span className="text-[#14171A] font-medium">{ride.dropAddress || 'Destination point'}</span>
                </div>
                <div className="flex items-center justify-between border-t border-[#2B3036]/10 pt-2 text-[#64748B]">
                  <span>Fare: <b className="font-display text-sm text-[#14171A]">{fmt(ride.fare)}</b></span>
                  <span>{ride.distanceKm} km · {TYPES[ride.type]}</span>
                </div>
              </div>

              {/* Completed Ride Actions */}
              {ride.status === 'completed' && (
                <div className="space-y-3 rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#16A34A]">Trip completed</span>
                    {ride.paymentStatus === 'paid' ? (
                      <span className="inline-flex items-center gap-1 rounded bg-[#16A34A]/20 px-2 py-0.5 text-xs font-bold text-[#16A34A]">
                        Paid ✔
                      </span>
                    ) : (
                      <button className="btn py-2 text-xs" disabled={busy} onClick={pay}>
                        Pay {fmt(ride.fare)} by card
                      </button>
                    )}
                  </div>

                  {/* Rating widget */}
                  <div className="border-t border-[#16A34A]/20 pt-3">
                    {ride.rating ? (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#14171A]">Your rating:</span>
                        <Stars value={ride.rating} />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="block text-xs font-bold text-[#14171A]">Rate your driver</span>
                        <Stars value={stars} onPick={setStars} />
                        <input
                          className="field"
                          placeholder="Feedback or driver compliments (optional)"
                          value={review}
                          onChange={(e) => setReview(e.target.value)}
                        />
                        <button className="btn-ghost w-full text-xs" disabled={busy} onClick={rate}>
                          Submit rating
                        </button>
                      </div>
                    )}
                  </div>

                  <Link
                    className="block text-center text-xs font-semibold text-[#14171A] underline underline-offset-2"
                    to={`/receipt/${ride._id}`}
                  >
                    View printable receipt
                  </Link>
                </div>
              )}

              {/* Secondary Cancel Action */}
              {['requested', 'accepted', 'arrived'].includes(ride.status) && (
                <div className="pt-2 text-center">
                  <button
                    className="text-xs font-semibold text-[#D93025] hover:underline disabled:opacity-50"
                    disabled={busy}
                    onClick={cancel}
                  >
                    Cancel this ride
                  </button>
                </div>
              )}

              {/* Reset to book again */}
              {['completed', 'cancelled'].includes(ride.status) && (
                <button className="btn w-full" onClick={reset}>
                  Book another ride
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
