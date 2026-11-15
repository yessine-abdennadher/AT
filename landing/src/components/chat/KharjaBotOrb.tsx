import { useId } from 'react';

export function KharjaBotOrb({ size = 56 }: { size?: number }) {
  const id = useId().replace(/:/g, '');
  const base = `${id}-orb`;
  return <svg className="kharja-bot-orb" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${base}-body`} x1="8%" y1="8%" x2="92%" y2="92%">
        <stop offset="0%" stopColor="#8CBBF8" />
        <stop offset="34%" stopColor="#C2A9FA" />
        <stop offset="68%" stopColor="#DBCDFD" />
        <stop offset="100%" stopColor="#FCE3E4" />
      </linearGradient>
      <radialGradient id={`${base}-core`} cx="30%" cy="24%" r="82%">
        <stop offset="0%" stopColor="#fff" stopOpacity=".9" />
        <stop offset="35%" stopColor="#d9f0ff" stopOpacity=".48" />
        <stop offset="100%" stopColor="#C2A9FA" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${base}-ribbon`} x1="8%" y1="90%" x2="90%" y2="8%">
        <stop offset="0%" stopColor="#8CBBF8" stopOpacity=".9" />
        <stop offset="45%" stopColor="#C2A9FA" stopOpacity=".82" />
        <stop offset="76%" stopColor="#FCE3E4" stopOpacity=".72" />
        <stop offset="100%" stopColor="#fff" stopOpacity=".14" />
      </linearGradient>
      <radialGradient id={`${base}-glass`} cx="24%" cy="18%" r="92%">
        <stop offset="0%" stopColor="#fff" stopOpacity=".45" />
        <stop offset="52%" stopColor="#fff" stopOpacity="0" />
        <stop offset="100%" stopColor="#8CBBF8" stopOpacity=".32" />
      </radialGradient>
      <clipPath id={`${base}-clip`}><circle cx="32" cy="30" r="27" /></clipPath>
      <filter id={`${base}-glow`} x="-35%" y="-35%" width="170%" height="180%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
    </defs>
    <ellipse cx="32" cy="60" rx="17" ry="2.2" fill="#8CBBF8" opacity=".3" filter={`url(#${base}-glow)`} />
    <circle cx="32" cy="30" r="29" fill="#C2A9FA" opacity=".24" filter={`url(#${base}-glow)`} />
    <g clipPath={`url(#${base}-clip)`}>
      <circle cx="32" cy="30" r="27" fill={`url(#${base}-body)`} />
      <circle cx="32" cy="30" r="27" fill={`url(#${base}-core)`} />
      <path d="M3 37C12 15 22 12 32 22c8 8 12 17 20 13 5-2 8-8 12-16" fill="none" stroke={`url(#${base}-ribbon)`} strokeWidth="8" strokeLinecap="round" opacity=".88" />
      <path d="M2 43c10 2 13 12 23 11 11-1 17-15 28-15 5 0 8 3 12 7" fill="none" stroke="#8CBBF8" strokeWidth="7" strokeLinecap="round" opacity=".5" />
      <path d="M7 29c6-13 17-21 30-19 8 1 14 5 20 12" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity=".7" />
      <ellipse cx="20" cy="18" rx="10" ry="4" transform="rotate(-34 20 18)" fill="#fff" opacity=".38" />
      <circle cx="15" cy="17" r="2.1" fill="#fff" opacity=".9" />
      <circle cx="32" cy="30" r="27" fill={`url(#${base}-glass)`} />
    </g>
    <circle cx="32" cy="30" r="27" fill="none" stroke="#fff" strokeOpacity=".76" strokeWidth="1.4" />
    <circle cx="32" cy="30" r="25.4" fill="none" stroke="#8CBBF8" strokeOpacity=".38" strokeWidth=".8" />
  </svg>;
}
