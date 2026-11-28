// Neirah brand system.
//
// Mark: the "pipeline N". One continuous stroke traces a lead's path (up, across, onward),
// and the final stroke stops short of a light-blue node: the destination, a won customer.
// Solid brand blue (#2457A6, taken from the Neirah Tech logo), no gradients, so it reads at 16px
// and sits on navy or white without changes. public/favicon.svg uses the same geometry.
//
// Lockup: mark + "Neirah" wordmark, with an optional "CRM" descriptor after a hairline rule.

export const BRAND_BLUE = '#2457A6'

export function NeirahMark({ size = 32, className = '', title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`shrink-0 ${className}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <rect width="32" height="32" rx="8" fill={BRAND_BLUE} />
      <path
        d="M9.6 23V11.2c0-1.3 1.6-1.8 2.4-.8l8 10.8c.8 1 2.4.5 2.4-.8v-4"
        stroke="#fff"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22.4" cy="9.4" r="2.5" fill="#9CC8FF" />
    </svg>
  )
}

// tone: 'dark' for navy backgrounds (white wordmark), 'light' for white or light-gray backgrounds.
export default function NeirahLogo({ tone = 'light', size = 32, descriptor = true, className = '' }) {
  const onDark = tone === 'dark'
  const wordSize = Math.round(size * 0.6)

  return (
    <div className={`inline-flex items-center ${className}`} style={{ gap: Math.round(size * 0.32) }} role="img" aria-label="Neirah CRM">
      <NeirahMark size={size} />
      <span
        aria-hidden="true"
        className={`font-semibold leading-none ${onDark ? 'text-white' : 'text-[#0B1530]'}`}
        style={{ fontSize: wordSize, letterSpacing: '-0.025em' }}
      >
        Neirah
      </span>
      {descriptor && (
        <>
          <span aria-hidden="true" className={onDark ? 'bg-white/20' : 'bg-slate-300'} style={{ width: 1, height: Math.round(size * 0.5) }} />
          <span
            aria-hidden="true"
            className={`font-medium leading-none ${onDark ? 'text-slate-400' : 'text-slate-500'}`}
            style={{ fontSize: Math.round(size * 0.41), letterSpacing: '0.01em' }}
          >
            CRM
          </span>
        </>
      )}
    </div>
  )
}
