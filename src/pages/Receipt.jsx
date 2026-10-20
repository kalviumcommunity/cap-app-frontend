import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, fmt } from '../api';
import { TYPES, VehicleIcon } from '../components/ui.jsx';

export default function Receipt() {
  const { id } = useParams();
  const [r, setR] = useState(null);

  useEffect(() => {
    api(`/rides/${id}`).then(setR).catch(() => setR(false));
  }, [id]);

  if (r === false) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-2xl border border-[#D93025]/20 bg-[#D93025]/5 p-6 space-y-3">
          <span className="text-3xl block">⚠️</span>
          <h2 className="font-display text-base font-bold text-[#D93025]">Receipt not found</h2>
          <p className="text-xs text-[#64748B]">We could not retrieve this ride receipt. It may have expired or does not exist.</p>
          <Link to="/history" className="btn inline-flex text-xs">
            Return to rides
          </Link>
        </div>
      </div>
    );
  }

  if (!r) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="font-display text-sm font-semibold text-[#64748B]">Loading receipt details…</p>
      </div>
    );
  }

  const receiptNo = String(r._id).slice(-8).toUpperCase();

  const row = (label, value) => (
    <div className="flex items-start justify-between gap-4 border-b border-[#2B3036]/10 py-2.5 text-xs">
      <span className="text-[#64748B] font-medium">{label}</span>
      <span className="text-right font-semibold text-[#14171A]">{value || '—'}</span>
    </div>
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      {/* Top back navigation (hidden in print) */}
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          to="/history"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#14171A]"
        >
          ← Back to trip history
        </Link>
        <span className="text-xs text-[#64748B]">Official e-receipt</span>
      </div>

      {/* Ticket-Style Receipt Card */}
      <div className="relative rounded-2xl border-2 border-[#2B3036]/15 bg-white p-6 shadow-sm sm:p-8 print:border-0 print:shadow-none print:p-0">
        {/* Ticket Header */}
        <div className="border-b-2 border-dashed border-[#2B3036]/20 pb-5 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFC400] text-sm">
              🚖
            </span>
            <span className="font-display text-base font-extrabold tracking-tight text-[#14171A]">
              Cab App Express
            </span>
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight text-[#14171A]">
            Ride Tax Invoice & Receipt
          </h1>
          <p className="mt-1 font-mono text-xs font-semibold text-[#64748B]">
            RECEIPT #{receiptNo}
          </p>
        </div>

        {/* Perforated Notches on Card Edges (visual flourish) */}
        <div className="absolute -left-3.5 top-[118px] h-7 w-7 rounded-full bg-[#FAFAF7] border-r-2 border-[#2B3036]/15 print:hidden" />
        <div className="absolute -right-3.5 top-[118px] h-7 w-7 rounded-full bg-[#FAFAF7] border-l-2 border-[#2B3036]/15 print:hidden" />

        {/* Receipt Content Rows */}
        <div className="py-4 space-y-1">
          {row('Date & Time', new Date(r.completedAt || r.createdAt).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }))}
          {row('Passenger', r.rider?.name)}
          {row('Driver & Vehicle', r.driver ? `${r.driver.name} · ${r.driver.plate}` : 'Assigned driver')}
          {row('Vehicle Type', (
            <span className="inline-flex items-center gap-1.5">
              <VehicleIcon type={r.type} className="h-4 w-4" />
              <span>{TYPES[r.type]}</span>
            </span>
          ))}
          {row('Pickup Address', r.pickupAddress || 'Set pickup point')}
          {row('Drop Address', r.dropAddress || 'Set destination point')}
          {row('Distance Traveled', `${r.distanceKm} km`)}
          {row('Payment Status', (
            <span className={r.paymentStatus === 'paid' ? 'text-[#16A34A] font-bold' : 'text-[#D93025] font-bold'}>
              {r.paymentStatus === 'paid' ? 'Paid by Card ✔' : 'Payment Due'}
            </span>
          ))}
        </div>

        {/* Total Fare Box */}
        <div className="rounded-xl border border-[#2B3036]/10 bg-[#FAFAF7] p-4 my-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-xs uppercase tracking-wider text-[#64748B] font-bold">
                Total Fare Paid
              </span>
              <span className="text-[11px] text-[#64748B]">Includes all city tolls & taxes</span>
            </div>
            <span className="font-display text-2xl font-extrabold text-[#14171A]">
              {fmt(r.fare)}
            </span>
          </div>
        </div>

        {/* Stylized Transit Barcode */}
        <div className="mt-6 pt-4 border-t border-[#2B3036]/10 text-center">
          <div className="mx-auto flex h-10 w-48 items-center justify-between opacity-70">
            {[2, 4, 1, 3, 5, 2, 6, 2, 1, 4, 3, 2, 5, 1, 3, 2, 4, 1, 3, 5, 2, 4, 1].map((w, i) => (
              <span
                key={i}
                className="inline-block bg-[#14171A] h-full"
                style={{ width: `${w * 1.5}px` }}
              />
            ))}
          </div>
          <span className="mt-2 block font-mono text-[10px] text-[#64748B] tracking-widest">
            * {receiptNo} *
          </span>
        </div>

        {/* Action Buttons (hidden in print) */}
        <div className="mt-6 space-y-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="btn w-full gap-2 shadow-sm"
          >
            <span>🖨️</span> Print or save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
