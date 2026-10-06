// SVG logo matching the Conecta design — transparent background, no white box
export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 92"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Conecta"
    >
      {/* Speech bubble outline — thick green stroke, transparent fill */}
      <path
        d="M85 4H15C8.92 4 4 8.92 4 15v46c0 6.08 4.92 11 11 11h8l-6 16 22-16h46c6.08 0 11-4.92 11-11V15c0-6.08-4.92-11-11-11z"
        stroke="#00e676"
        strokeWidth="6"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Left pill */}
      <rect x="28" y="21" width="16" height="27" rx="8" fill="#00e676" />
      {/* Right pill */}
      <rect x="56" y="21" width="16" height="27" rx="8" fill="#00e676" />
    </svg>
  )
}
