type IconProps = { className?: string };

const iconClass = (className?: string) =>
  ['da-authoring-playback__icon', className].filter(Boolean).join(' ');

export function PlaybackPlayIcon({ className }: IconProps) {
  return (
    <svg className={iconClass(className)} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.14v13.72c0 .79.87 1.27 1.54.84l11.02-6.86a1 1 0 0 0 0-1.7L9.54 4.3A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

export function PlaybackPauseIcon({ className }: IconProps) {
  return (
    <svg className={iconClass(className)} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 5h3v14H7V5Zm7 0h3v14h-3V5Z" />
    </svg>
  );
}

export function PlaybackStopIcon({ className }: IconProps) {
  return (
    <svg className={iconClass(className)} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7h10v10H7V7Z" />
    </svg>
  );
}

export function PlaybackRecordIcon({ className }: IconProps) {
  return (
    <svg className={iconClass(`da-authoring-playback__icon--record ${className ?? ''}`.trim())} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
    </svg>
  );
}

export function PlaybackRecordStopIcon({ className }: IconProps) {
  return (
    <svg className={iconClass(className)} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 8h8v8H8V8Z" />
    </svg>
  );
}

export function PlaybackSaveIcon({ className }: IconProps) {
  return (
    <svg className={iconClass(`da-authoring-playback__icon--save ${className ?? ''}`.trim())} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v8.5m0 0 3.5-3.5M12 11.5 8.5 8M5 19h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlaybackReverseIcon({ className }: IconProps) {
  return (
    <svg className={iconClass(`da-authoring-playback__icon--reverse ${className ?? ''}`.trim())} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 7v10M7 17l-4-4 4-4M17 7v10M17 7l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
