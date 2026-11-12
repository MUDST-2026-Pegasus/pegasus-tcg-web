/** หิมะตกธีมคริสต์มาส ทุกหน้า — CSS ล้วน ไม่บังการคลิก ปิดเองเมื่อผู้ใช้ตั้ง reduced motion */
const FLAKES = Array.from({ length: 40 }, (_, i) => ({
  left: (i * 37) % 100,
  size: 4 + ((i * 7) % 6),
  duration: 8 + ((i * 13) % 10),
  delay: -((i * 11) % 18),
  drift: ((i % 5) - 2) * 15,
}));

export function Snowfall() {
  return (
    <div aria-hidden className="snowfall pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {FLAKES.map((flake, i) => (
        <span
          key={i}
          className="snowflake"
          style={{
            left: `${flake.left}%`,
            width: flake.size,
            height: flake.size,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
            ["--drift" as string]: `${flake.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
