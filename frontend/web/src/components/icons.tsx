import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 22, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const PlusIcon = (p: IconProps) => (
  <Svg strokeWidth={2.4} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Svg size={15} strokeWidth={2.4} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

export const SendIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </Svg>
);

export const ChatIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

export function PlaceholderGlyph({ icon, ...p }: IconProps & { icon?: string }) {
  const props = { size: 42, strokeWidth: 1.8, ...p };
  switch (icon) {
    case 'monitor':
      return (
        <Svg {...props}>
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </Svg>
      );
    case 'file':
      return (
        <Svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </Svg>
      );
    case 'board':
      return (
        <Svg {...props}>
          <rect x="3" y="3" width="7" height="18" />
          <rect x="14" y="3" width="7" height="10" />
        </Svg>
      );
    case 'dollar':
      return (
        <Svg {...props}>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </Svg>
      );
    case 'code':
      return (
        <Svg {...props}>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </Svg>
      );
    case 'image':
      return (
        <Svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </Svg>
      );
    case 'play':
    default:
      return (
        <Svg {...props}>
          <polygon points="5 3 19 12 5 21 5 3" />
        </Svg>
      );
  }
}
