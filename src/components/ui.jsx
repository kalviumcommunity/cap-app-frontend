export const STATUS = {
  requested: 'Looking for a driver',
  accepted: 'Driver on the way',
  arrived: 'Driver has arrived',
  in_progress: 'Ride in progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const TYPES = { bike: 'Bike', auto: 'Auto', car: 'Car' };

export const VEHICLE_DETAILS = {
  bike: {
    name: 'Bike',
    tag: 'Quickest in traffic',
    capacity: '1 person',
  },
  auto: {
    name: 'Auto',
    tag: 'Popular & economical',
    capacity: '3 people',
  },
  car: {
    name: 'Car',
    tag: 'Comfort with AC',
    capacity: '4 people',
  },
};

export function VehicleIcon({ type = 'car', className = 'w-6 h-6' }) {
  if (type === 'bike') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="5.5" cy="17.5" r="3.5" />
        <circle cx="18.5" cy="17.5" r="3.5" />
        <path d="M15 6h-3l-3 6.5h6.5l2-3.5h3" />
        <path d="M9 17.5l3-8" />
        <path d="M14 6l1.5-2H18" />
      </svg>
    );
  }
  if (type === 'auto') {
    // Authentic Indian three-wheeler auto rickshaw silhouette
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="6" cy="18" r="2.5" />
        <circle cx="18" cy="18" r="2.5" />
        <path d="M3 13h4l2-6h9a2 2 0 0 1 2 2v6h-1" />
        <path d="M9 7h8v5H9z" />
        <path d="M3 13v-3a2 2 0 0 1 2-2h4" />
        <path d="M8.5 18h7" />
      </svg>
    );
  }
  // Car / Cab
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 16h14a2 2 0 0 0 2-2l-1.5-5a2 2 0 0 0-1.9-1.4H6.4A2 2 0 0 0 4.5 9L3 14a2 2 0 0 0 2 2z" />
      <circle cx="7" cy="16.5" r="2.5" />
      <circle cx="17" cy="16.5" r="2.5" />
      <path d="M6 10l1.2-3h9.6l1.2 3" />
    </svg>
  );
}

export function Badge({ status }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#16A34A]/10 px-2.5 py-1 text-xs font-semibold text-[#16A34A]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
        {STATUS[status] || status}
      </span>
    );
  }
  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#D93025]/10 px-2.5 py-1 text-xs font-semibold text-[#D93025]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#D93025]" />
        {STATUS[status] || status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-[#FFC400]/20 px-2.5 py-1 text-xs font-semibold text-[#14171A]">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#14171A]" />
      {STATUS[status] || status}
    </span>
  );
}

export function Stars({ value = 0, onPick }) {
  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onPick}
          onClick={() => onPick && onPick(n)}
          aria-label={`Rate ${n} stars`}
          className={`flex h-8 w-8 items-center justify-center rounded-md text-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC400] ${
            !onPick ? 'cursor-default' : 'cursor-pointer hover:bg-black/5 active:scale-95'
          } ${n <= value ? 'text-[#FFC400]' : 'text-[#2B3036]/20'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function StatusStepper({ status }) {
  const steps = [
    { key: 'requested', label: 'Requested' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'arrived', label: 'Arrived' },
    { key: 'in_progress', label: 'On trip' },
    { key: 'completed', label: 'Completed' },
  ];

  if (status === 'cancelled') {
    return (
      <div className="rounded-xl border border-[#D93025]/20 bg-[#D93025]/5 p-3 text-center text-sm font-semibold text-[#D93025]">
        Ride was cancelled
      </div>
    );
  }

  const order = ['requested', 'accepted', 'arrived', 'in_progress', 'completed'];
  const currentIndex = order.indexOf(status);

  return (
    <div className="w-full py-1">
      <div className="flex items-center justify-between">
        {steps.map((s, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <div key={s.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                    isDone
                      ? 'bg-[#16A34A] text-white'
                      : isCurrent
                      ? 'bg-[#14171A] text-[#FFC400] ring-4 ring-[#FFC400]/30'
                      : 'border border-[#2B3036]/20 bg-white text-[#64748B]'
                  }`}
                >
                  {isDone ? '✓' : idx + 1}
                </div>
                <span
                  className={`mt-1 text-[10px] whitespace-nowrap ${
                    isCurrent
                      ? 'font-bold text-[#14171A]'
                      : isDone
                      ? 'font-medium text-[#16A34A]'
                      : 'text-[#64748B]'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`mx-1.5 h-0.5 flex-1 self-start mt-3 transition-colors ${
                    idx < currentIndex ? 'bg-[#16A34A]' : 'bg-[#2B3036]/15'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
