interface DecorativeGearProps {
  className?: string;
  size?: number;
}

export function DecorativeGear({ className = "", size = 100 }: DecorativeGearProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`opacity-10 ${className}`}
      fill="currentColor"
    >
      <path d="M50 20 L54 30 L66 28 L60 38 L70 44 L60 50 L70 56 L60 62 L66 72 L54 70 L50 80 L46 70 L34 72 L40 62 L30 56 L40 50 L30 44 L40 38 L34 28 L46 30 Z" />
      <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="50" cy="50" r="8" />
    </svg>
  );
}
