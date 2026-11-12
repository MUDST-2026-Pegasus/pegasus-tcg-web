import { Particles, ParticlesProvider } from "@tsparticles/react";
import type { Engine } from "@tsparticles/engine";
import { loadSnowPreset } from "@tsparticles/preset-snow";
import { loadImageShape } from "@tsparticles/shape-image";

// เกล็ดหิมะ 6 แฉกสีฟ้า (ตามแบบที่ขอ)
const FLAKE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -50 100 100"><defs><linearGradient id="g" x1="0" y1="-1" x2="0" y2="1"><stop offset="0" stop-color="#cfe6ff"/><stop offset="1" stop-color="#5b8fe0"/></linearGradient></defs><g id="a"><path d="M0 0V-44M0 -30L-10 -40M0 -30L10 -40M0 -16L-8 -24M0 -16L8 -24" stroke="#3b6fc9" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M0 0V-44M0 -30L-10 -40M0 -30L10 -40M0 -16L-8 -24M0 -16L8 -24" stroke="url(#g)" stroke-width="6" stroke-linecap="round" fill="none"/></g><use href="#a" transform="rotate(60)"/><use href="#a" transform="rotate(120)"/><use href="#a" transform="rotate(180)"/><use href="#a" transform="rotate(240)"/><use href="#a" transform="rotate(300)"/></svg>`;

async function init(engine: Engine) {
  await loadSnowPreset(engine);
  await loadImageShape(engine);
}

/** หิมะตกธีมคริสต์มาส ทุกหน้า (tsparticles preset snow) — ไม่บังการคลิก ปิดเองเมื่อผู้ใช้ตั้ง reduced motion */
export function Snowfall() {
  return (
    <ParticlesProvider init={init}>
      <Particles
        id="snowfall"
        className="snowfall pointer-events-none fixed inset-0 z-[60]"
        options={{
          preset: "snow",
          background: { opacity: 0 },
          fullScreen: { enable: false },
          detectRetina: true,
          particles: {
            number: { value: 12 },
            shape: { type: "image", options: { image: { src: `data:image/svg+xml,${encodeURIComponent(FLAKE_SVG)}`, width: 100, height: 100 } } },
            size: { value: { min: 6, max: 14 } },
            opacity: { value: { min: 0.6, max: 0.95 } },
          },
        }}
      />
    </ParticlesProvider>
  );
}
