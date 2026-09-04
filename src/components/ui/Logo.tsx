interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'nav';
  /** When false, shows icon portion only (for collapsed sidebar) */
  showTagline?: boolean;
  className?: string;
  /** Wrap logo in white card — useful on dark backgrounds */
  onDark?: boolean;
}

const sizes = {
  nav: { full: 'h-11 max-w-[170px]', icon: 'h-9 w-9' },
  sm: { full: 'h-[72px] max-w-[220px]', icon: 'h-10 w-10' },
  md: { full: 'h-[100px] max-w-[300px]', icon: 'h-14 w-14' },
  lg: { full: 'h-[140px] max-w-[380px]', icon: 'h-16 w-16' },
  xl: { full: 'h-[200px] max-w-[480px]', icon: 'h-20 w-20' },
};

export default function Logo({
  size = 'md',
  showTagline = true,
  className = '',
  onDark = false,
}: LogoProps) {
  const s = sizes[size];

  const img = (
    <img
      src="/logo.jpg"
      alt="GURUNANAK Transportation & Logistics"
      className={
        showTagline
          ? `${s.full} w-full object-contain rounded-2xl`
          : `${s.icon} object-cover object-top rounded-xl`
      }
      draggable={false}
    />
  );

  return (
    <div className={`flex items-center ${className}`}>
      {onDark ? (
        <div className="w-full max-w-[420px] rounded-2xl bg-white px-5 py-4 shadow-lg overflow-hidden">
          {img}
        </div>
      ) : (
        img
      )}
    </div>
  );
}
