import { useId, type SVGProps } from 'react';

export interface MirrorIconProps extends SVGProps<SVGSVGElement> {
  useGradient?: boolean;
}

export function MirrorIcon({
  className = 'w-6 h-6',
  useGradient = false,
  ...props
}: MirrorIconProps) {
  const gradId = useId();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={useGradient ? `url(#${gradId})` : (props.stroke || 'currentColor')}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {useGradient && (
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fd297b" />
            <stop offset="50%" stopColor="#ff5864" />
            <stop offset="100%" stopColor="#ff655b" />
          </linearGradient>
        </defs>
      )}
      <circle cx="12" cy="12" r="10" />
      <path d="M8.5 7.1 7.1 8.5" />
      <path d="M14 8.5 8.5 14" />
    </svg>
  );
}
