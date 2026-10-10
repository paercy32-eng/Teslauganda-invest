type Props = {
  size?: number;
  showText?: boolean;
  textColor?: string;
  accentColor?: string;
};

export default function SafranLogo({
  size = 40,
  showText = true,
  textColor = '#0A2540',
  accentColor = '#0A2540',
}: Props) {
  return (
    <div className="flex items-center gap-2">
      {/* Stylized "S" mark */}
      <div
        style={{
          width: size,
          height: size,
          background: accentColor,
          borderRadius: size / 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg
          width={size * 0.65}
          height={size * 0.65}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Stylized S */}
          <path
            d="M17 6H9.5C8.12 6 7 7.12 7 8.5S8.12 11 9.5 11h5c1.38 0 2.5 1.12 2.5 2.5S15.88 16 14.5 16H7"
            stroke="#00D9FF"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Text */}
      {showText && (
        <span
          style={{
            fontSize: size * 0.55,
            fontWeight: 800,
            letterSpacing: '-0.5px',
            color: textColor,
            lineHeight: 1,
          }}
        >
          Safran
        </span>
      )}
    </div>
  );
}
