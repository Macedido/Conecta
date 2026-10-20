import { useEffect, useRef } from 'react'

export default function Logo({ size = 40 }: { size?: number }) {
  const leftEye = useRef<SVGCircleElement>(null)
  const rightEye = useRef<SVGCircleElement>(null)

  useEffect(() => {
    const followPointer = (event: PointerEvent) => {
      for (const eye of [leftEye.current, rightEye.current]) {
        if (!eye) continue
        const bounds = eye.getBoundingClientRect()
        const x = bounds.left + bounds.width / 2
        const y = bounds.top + bounds.height / 2
        const angle = Math.atan2(event.clientY - y, event.clientX - x)
        const distance = Math.min(2.5, Math.hypot(event.clientX - x, event.clientY - y) / 16)
        eye.setAttribute('cx', String(Number(eye.dataset.baseX) + Math.cos(angle) * distance))
        eye.setAttribute('cy', String(Number(eye.dataset.baseY) + Math.sin(angle) * distance))
      }
    }
    window.addEventListener('pointermove', followPointer, { passive: true })
    return () => window.removeEventListener('pointermove', followPointer)
  }, [])

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
        stroke="#a9e58b"
        strokeWidth="6"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Left pill */}
      <rect x="28" y="21" width="16" height="27" rx="8" fill="#a9e58b" />
      {/* Right pill */}
      <rect x="56" y="21" width="16" height="27" rx="8" fill="#a9e58b" />
      <circle ref={leftEye} data-base-x="36" data-base-y="34" cx="36" cy="34" r="3.2" fill="#0b110f" className="logo-pupil" />
      <circle ref={rightEye} data-base-x="64" data-base-y="34" cx="64" cy="34" r="3.2" fill="#0b110f" className="logo-pupil" />
    </svg>
  )
}
