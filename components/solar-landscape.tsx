import { useId } from 'react';

export default function SolarLandscape({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  return <svg className={className} viewBox="0 0 900 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs><linearGradient id={`${id}-sky`} x2="1" y2="1"><stop stopColor="#7BB5E7"/><stop offset=".7" stopColor="#D9E9F7"/><stop offset="1" stopColor="#FFE9C8"/></linearGradient><linearGradient id={`${id}-hill`} x2="0" y2="1"><stop stopColor="#397DB8"/><stop offset="1" stopColor="#084C93"/></linearGradient><linearGradient id={`${id}-front`} x2="1" y2="1"><stop stopColor="#175CA0"/><stop offset="1" stopColor="#002F72"/></linearGradient></defs>
    <path fill={`url(#${id}-sky)`} d="M0 0h900v420H0z"/><circle cx="725" cy="127" r="51" fill="#FFAD35"/><circle cx="725" cy="127" r="69" fill="#FFAD35" opacity=".12"/>
    <path d="M0 257 114 179Q146 159 177 184L249 224 386 142Q415 123 443 147L525 206 643 153Q674 133 701 159L900 229V420H0Z" fill="#A4C4E2"/>
    <path d="m0 290 142-57q40-22 76 5l67 32 157-84q38-23 75 7l81 61 122-72q38-21 71 4l109 69v165H0Z" fill="#6D9CC9"/>
    <path d="M0 325q115-100 226-29t217-11q110-124 217-42t240 3v174H0Z" fill={`url(#${id}-hill)`}/>
    <path d="M0 375q126-92 294-15t311-27q166-119 295-45v132H0Z" fill={`url(#${id}-front)`}/>
    <path d="M503 420q35-47 129-68t114-59" stroke="#FFBB67" strokeWidth="6" opacity=".23" fill="none"/>
    <g fill="#236B36" opacity=".8"><path d="m820 291 20-43 20 43h-12l18 28h-19v28h-13v-28h-19l18-28z"/><path d="m863 337 16-35 16 35h-9l14 24h-15v22h-11v-22h-15l14-24z"/></g>
  </svg>;
}
