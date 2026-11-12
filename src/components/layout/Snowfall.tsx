import { Particles, ParticlesProvider } from "@tsparticles/react";
import { loadSnowPreset } from "@tsparticles/preset-snow";

/** หิมะตกธีมคริสต์มาส ทุกหน้า (tsparticles preset snow) — ไม่บังการคลิก ปิดเองเมื่อผู้ใช้ตั้ง reduced motion */
export function Snowfall() {
  return (
    <ParticlesProvider init={loadSnowPreset}>
      <Particles
        id="snowfall"
        className="snowfall pointer-events-none fixed inset-0 z-[60]"
        options={{
          preset: "snow",
          background: { opacity: 0 },
          fullScreen: { enable: false },
          detectRetina: true,
          // เงาเทาอ่อนให้เกล็ดสีขาวยังเห็นบนพื้นหลังสว่าง
          particles: { number: { value: 80 }, shadow: { enable: true, color: "#64748b", blur: 4 } },
        }}
      />
    </ParticlesProvider>
  );
}
