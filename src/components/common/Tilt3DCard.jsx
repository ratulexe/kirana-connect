import { useRef } from 'react';

export default function Tilt3DCard({ children, className = '', maxTilt = 8, ...props }) {
  const ref = useRef(null);

  const handleMove = (e) => {
    const card = ref.current;
    if (!card) return;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    card.style.transform = `perspective(800px) rotateX(${-y * maxTilt}deg) rotateY(${x * maxTilt}deg) translateZ(10px)`;
    card.style.transition = 'none';
  };

  const handleLeave = () => {
    const card = ref.current;
    if (!card) return;
    card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    card.style.transition = 'transform 0.4s cubic-bezier(0.22,0.61,0.36,1)';
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={className}
      style={{ willChange: 'transform' }}
      {...props}
    >
      {children}
    </div>
  );
}
