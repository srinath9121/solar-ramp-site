"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const ParticleCanvas = dynamic(() => import("@/components/ParticleCanvas"), { ssr: false });

// ─── REVEAL HOOK ─────────────────────────────────────────────
function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold });
    ob.observe(el);
    return () => ob.disconnect();
  }, [threshold]);
  return { ref, vis };
}

// ─── SCROLL Y ────────────────────────────────────────────────
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const fn = () => setY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return y;
}

export default function HomePage() {
  const scrollY = useScrollY();
  const heroR   = useReveal(0.01);
  const solarR  = useReveal(0.15);
  const gridR   = useReveal(0.1);
  const statsR  = useReveal(0.15);

  // Parallax for hero text
  const heroOffset = scrollY * 0.3;

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh", overflowX: "hidden" }}>
      <ParticleCanvas predClass={0} scrollY={scrollY} />

      {/* ═══ HERO ════════════════════════════════════════════ */}
      <section
        ref={heroR.ref}
        style={{
          height:          "100vh",
          display:         "flex",
          flexDirection:   "column",
          justifyContent:  "flex-end",
          padding:         "0 6vw 8vh",
          position:        "relative",
          zIndex:          2,
        }}
      >
        {/* Top-left label */}
        <div style={{
          position:  "absolute", top: "32px", left: "6vw",
          fontFamily:"var(--font-mono)", fontSize: "0.6rem",
          letterSpacing: "0.2em", color: "var(--muted)",
          textTransform: "uppercase",
          opacity: heroR.vis ? 1 : 0,
          transition: "opacity 1s 0.2s",
        }}>
          srinath · solar-ramp-detector · v2
        </div>

        {/* Top-right nav */}
        <nav style={{
          position: "absolute", top: "28px", right: "6vw",
          display: "flex", gap: "32px",
          opacity: heroR.vis ? 1 : 0,
          transition: "opacity 1s 0.3s",
        }}>
          {[["Model", "#model"], ["Demo", "/solar#inference"], ["Results", "/solar#results"]].map(([label, href]) => (
            <Link key={label} href={href} style={{
              fontFamily: "var(--font-mono)", fontSize: "0.62rem",
              letterSpacing: "0.16em", textTransform: "uppercase",
              color: "var(--sub)", textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--white)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--sub)")}
            >{label}</Link>
          ))}
        </nav>

        {/* Hero title — parallax */}
        <div style={{ transform: `translateY(${heroOffset}px)` }}>
          <div style={{
            fontFamily:    "var(--font-mono)", fontSize: "0.62rem",
            letterSpacing: "0.22em", color: "var(--muted)",
            textTransform: "uppercase", marginBottom: "16px",
            opacity: heroR.vis ? 1 : 0,
            transition: "opacity 0.8s 0.4s",
          }}>
            Deep Learning &nbsp;·&nbsp; Solar Energy &nbsp;·&nbsp; Ramp Detection
          </div>

          <h1 style={{
            fontFamily:    "var(--font-disp)",
            fontSize:      "clamp(5rem, 14vw, 14rem)",
            fontWeight:    900,
            lineHeight:    0.88,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
            color:         "var(--white)",
            opacity:       heroR.vis ? 1 : 0,
            transform:     heroR.vis ? "translateY(0)" : "translateY(40px)",
            transition:    "opacity 0.9s 0.5s var(--ease-out), transform 0.9s 0.5s var(--ease-out)",
          }}>
            Solar<br />Ramp<br />Detector
          </h1>
        </div>

        {/* Bottom row */}
        <div style={{
          display:       "flex",
          justifyContent:"space-between",
          alignItems:    "flex-end",
          marginTop:     "40px",
          opacity:       heroR.vis ? 1 : 0,
          transition:    "opacity 0.8s 0.8s",
        }}>
          <p style={{
            fontFamily: "var(--font-mono)", fontSize: "0.72rem",
            color: "var(--sub)", lineHeight: 1.7, maxWidth: "360px",
          }}>
            Detecting severe PV output drops ≥15% in 10 minutes.<br />
            ResNet-18 + LSTM on 169,372 chronologically unseen sky images.
          </p>
          <Link href="/solar" style={{
            fontFamily: "var(--font-disp)", fontSize: "0.82rem",
            fontWeight: 600, letterSpacing: "0.18em",
            textTransform: "uppercase", color: "var(--white)",
            textDecoration: "none", border: "1px solid var(--white)",
            padding: "14px 32px", transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--white)"; e.currentTarget.style.color = "var(--bg)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--white)"; }}
          >
            Run Live Demo →
          </Link>
        </div>

        {/* Scroll cue */}
        <div style={{
          position: "absolute", bottom: "28px", left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "var(--font-mono)", fontSize: "0.55rem",
          letterSpacing: "0.2em", color: "var(--muted)",
          textTransform: "uppercase",
          animation: "fadeScroll 2s ease-in-out infinite",
          opacity: heroR.vis ? 1 : 0,
          transition: "opacity 1s 1.2s",
        }}>
          scroll ↓
        </div>
      </section>

      <style>{`
        @keyframes fadeScroll {
          0%,100%{opacity:0.3} 50%{opacity:1}
        }
      `}</style>

      {/* ═══ SOLAR TEASER ════════════════════════════════════ */}
      <section
        id="model"
        ref={solarR.ref}
        style={{
          padding:   "120px 6vw",
          position:  "relative",
          zIndex:    2,
          borderTop: "1px solid var(--line)",
        }}
      >
        {/* Rule reveal */}
        <div style={{
          height: "1px", background: "var(--white)",
          width:  solarR.vis ? "100%" : "0%",
          transition: "width 1.4s var(--ease-out)",
          marginBottom: "56px",
        }} />

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "60px",
          alignItems: "end",
          marginBottom: "80px",
        }}>
          {/* Left */}
          <div style={{
            opacity:   solarR.vis ? 1 : 0,
            transform: solarR.vis ? "translateY(0)" : "translateY(36px)",
            transition:"opacity 1s 0.2s var(--ease-out), transform 1s 0.2s var(--ease-out)",
          }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "0.58rem",
              letterSpacing: "0.2em", color: "var(--muted)",
              textTransform: "uppercase", marginBottom: "20px",
            }}>01 — Featured Project</div>
            <h2 style={{
              fontFamily: "var(--font-disp)",
              fontSize:   "clamp(3rem, 7vw, 7rem)",
              fontWeight: 800,
              lineHeight: 0.92,
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
              color: "var(--white)",
            }}>
              Solar<br />Ramp<br />Detection
            </h2>
          </div>

          {/* Right */}
          <div style={{
            opacity:   solarR.vis ? 1 : 0,
            transform: solarR.vis ? "translateY(0)" : "translateY(36px)",
            transition:"opacity 1s 0.35s var(--ease-out), transform 1s 0.35s var(--ease-out)",
          }}>
            <p style={{
              fontFamily: "var(--font-mono)", fontSize: "0.75rem",
              color: "var(--sub)", lineHeight: 1.8,
              marginBottom: "36px", maxWidth: "400px",
            }}>
              V2 model trained on the SKIPPD dataset with physics-constrained
              weighted multi-task loss. Substantial improvement in severe event
              recall (+32.8pp) at the cost of minor accuracy trade-off — the
              correct engineering decision for grid operators.
            </p>
            <Link href="/solar" style={{
              fontFamily: "var(--font-disp)", fontSize: "0.78rem",
              fontWeight: 600, letterSpacing: "0.16em",
              textTransform: "uppercase", color: "var(--white)",
              textDecoration: "none", borderBottom: "1px solid var(--white)",
              paddingBottom: "4px",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.5")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              Open Full Demo →
            </Link>
          </div>
        </div>

        {/* Stats grid */}
        <div ref={statsR.ref} style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1px",
          background: "var(--line)",
          border: "1px solid var(--line)",
        }}>
          {[
            { v: "80.5%",   l: "Severe Recall",    d: "+32.8pp vs V1" },
            { v: "0.950",   l: "R² Score",          d: "Regression head" },
            { v: "169,372", l: "Unseen Samples",    d: "Rows 180K–349K" },
            { v: "V2",      l: "Architecture",      d: "ResNet-18 + LSTM" },
          ].map((s, i) => (
            <div key={i} style={{
              background: "var(--bg)",
              padding: "36px 28px",
              opacity:   statsR.vis ? 1 : 0,
              transform: statsR.vis ? "translateY(0)" : "translateY(20px)",
              transition:`opacity 0.7s ${0.1 + i * 0.07}s var(--ease-out),
                          transform 0.7s ${0.1 + i * 0.07}s var(--ease-out)`,
            }}>
              <div style={{
                fontFamily: "var(--font-disp)",
                fontSize: "clamp(2rem, 3.5vw, 3.2rem)",
                fontWeight: 700, color: "var(--white)", lineHeight: 1,
              }}>{s.v}</div>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: "0.58rem",
                letterSpacing: "0.16em", textTransform: "uppercase",
                color: "var(--muted)", marginTop: "10px",
              }}>{s.l}</div>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: "0.6rem",
                color: "var(--line2)", marginTop: "6px",
              }}>{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PROJECT GRID ════════════════════════════════════ */}
      <section
        ref={gridR.ref}
        style={{
          padding:   "80px 6vw 140px",
          position:  "relative",
          zIndex:    2,
          borderTop: "1px solid var(--line)",
        }}
      >
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "baseline", marginBottom: "56px",
          paddingBottom: "20px", borderBottom: "1px solid var(--line)",
          opacity:   gridR.vis ? 1 : 0,
          transition:"opacity 0.8s 0.1s",
        }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "0.58rem",
            letterSpacing: "0.2em", color: "var(--muted)",
            textTransform: "uppercase",
          }}>02 — Work</div>
          <div style={{
            fontFamily: "var(--font-disp)", fontSize: "clamp(2rem,4vw,3.5rem)",
            fontWeight: 800, textTransform: "uppercase",
            color: "var(--white)", letterSpacing: "-0.01em",
          }}>Selected Projects</div>
        </div>

        <ProjectGrid visible={gridR.vis} />
      </section>

      {/* ═══ FOOTER ══════════════════════════════════════════ */}
      <footer style={{
        borderTop: "1px solid var(--line)",
        padding: "32px 6vw",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "relative", zIndex: 2,
      }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: "0.58rem",
          letterSpacing: "0.14em", color: "var(--muted)",
          textTransform: "uppercase",
        }}>
          Srinath · BSc Data Science · 2025
        </div>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: "0.58rem",
          letterSpacing: "0.14em", color: "var(--muted)",
        }}>
          <a href="https://github.com/srinath9121" target="_blank" rel="noopener"
            style={{ color: "inherit", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--white)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
          >GitHub ↗</a>
        </div>
      </footer>
    </main>
  );
}

// ─── PROJECT GRID ─────────────────────────────────────────────
function ProjectGrid({ visible }: { visible: boolean }) {
  const projects = [
    {
      idx:      "01",
      title:    "Solar Ramp\nDetector",
      sub:      "V2 · ResNet-18 + LSTM · Physics-constrained MTL",
      href:     "/solar",
      external: false,
      tags:     ["Deep Learning", "CV", "Time Series"],
      pal:      { bg: 0x050810, c1: [0.08,0.45,0.40], c2: [0.04,0.28,0.52] },
    },
    {
      idx:      "02",
      title:    "Research\nProblem Miner",
      sub:      "NLP pipeline · arXiv · Gap extraction",
      href:     "https://github.com/srinath9121",
      external: true,
      tags:     ["NLP", "Transformers", "Python"],
      pal:      { bg: 0x080807, c1: [0.55,0.42,0.08], c2: [0.70,0.55,0.04] },
    },
    {
      idx:      "03",
      title:    "NathOS\nPortfolio",
      sub:      "Next.js · Supabase · Vercel · Win98 UI",
      href:     "https://github.com/srinath9121/Nath-portfolio",
      external: true,
      tags:     ["Next.js", "TypeScript", "Design"],
      pal:      { bg: 0x080808, c1: [0.35,0.35,0.35], c2: [0.55,0.55,0.55] },
    },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "1px",
      background: "var(--line)",
      border: "1px solid var(--line)",
    }}>
      {projects.map((p, i) => (
        <ProjectCard key={p.idx} project={p} index={i} visible={visible} />
      ))}
    </div>
  );
}

function ProjectCard({ project, index, visible }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hovRef    = useRef(false);
  const [hov, setHov] = useState(false);
  const dispRef   = useRef<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let disposed = false;

    import("three").then((THREE) => {
      if (disposed) return;
      const pal = project.pal;
      const W = canvas.clientWidth || 300, H = 220;
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W, H);
      renderer.setClearColor(pal.bg, 1);

      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 500);
      camera.position.z = 55;

      const N   = 400;
      const pos = new Float32Array(N * 3);
      const col = new Float32Array(N * 3);
      const sz  = new Float32Array(N);
      const c1 = pal.c1, c2 = pal.c2;
      for (let i = 0; i < N; i++) {
        pos[i*3]   = (Math.random()-.5)*100;
        pos[i*3+1] = (Math.random()-.5)*65;
        pos[i*3+2] = (Math.random()-.5)*50;
        const t    = Math.random();
        col[i*3]   = c1[0]*(1-t)+c2[0]*t;
        col[i*3+1] = c1[1]*(1-t)+c2[1]*t;
        col[i*3+2] = c1[2]*(1-t)+c2[2]*t;
        sz[i] = 0.7 + Math.random() * 1.8;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("pColor",   new THREE.BufferAttribute(col, 3));
      geo.setAttribute("pSize",    new THREE.BufferAttribute(sz,  1));

      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uHov: { value: 0 } },
        vertexShader: `
          attribute float pSize; attribute vec3 pColor;
          varying vec3 vCol; varying float vA;
          uniform float uTime, uHov;
          void main(){
            vCol=pColor;
            float pulse=0.6+0.4*sin(uTime*(0.6+uHov)+position.x*0.07);
            vA=pulse*(0.4+uHov*0.5);
            vec4 mv=modelViewMatrix*vec4(position,1.0);
            gl_PointSize=pSize*pulse*(200.0/-mv.z)*(1.0+uHov*0.6);
            gl_Position=projectionMatrix*mv;
          }`,
        fragmentShader: `
          varying vec3 vCol; varying float vA;
          void main(){
            float r=length(gl_PointCoord-0.5);
            float a=(1.0-smoothstep(0.0,0.5,r)*0.7)*vA;
            gl_FragColor=vec4(vCol,a);
          }`,
        transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const pts = new THREE.Points(geo, mat);
      scene.add(pts);

      let hovVal = 0;
      const clock = new THREE.Clock();
      let raf = 0;

      function loop() {
        raf = requestAnimationFrame(loop);
        if (disposed) return;
        mat.uniforms.uTime.value = clock.getElapsedTime();
        hovVal += ((hovRef.current ? 1 : 0) - hovVal) * 0.07;
        mat.uniforms.uHov.value = hovVal;
        pts.rotation.y += 0.003 + hovVal * 0.006;
        pts.rotation.x  = Math.sin(clock.getElapsedTime() * 0.2) * 0.04;
        renderer.render(scene, camera);
      }
      loop();
      dispRef.current = () => { disposed = true; cancelAnimationFrame(raf); renderer.dispose(); };
    });

    return () => { disposed = true; if (dispRef.current) dispRef.current(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Wrap = project.external ? "a" : Link;
  const wProps = project.external
    ? { href: project.href, target: "_blank", rel: "noopener noreferrer" }
    : { href: project.href };

  return (
    <Wrap
      {...(wProps as any)}
      style={{ textDecoration: "none", display: "block" }}
      onMouseEnter={() => { hovRef.current = true;  setHov(true);  }}
      onMouseLeave={() => { hovRef.current = false; setHov(false); }}
    >
      <div style={{
        background:  "var(--bg)",
        position:    "relative",
        overflow:    "hidden",
        cursor:      "none",
        opacity:     visible ? 1 : 0,
        transform:   visible ? "translateY(0)" : "translateY(28px)",
        transition:  `opacity 0.8s ${0.15 + index * 0.12}s var(--ease-out),
                      transform 0.8s ${0.15 + index * 0.12}s var(--ease-out)`,
      }}>
        {/* 3D canvas */}
        <canvas ref={canvasRef} style={{
          width: "100%", height: "220px", display: "block",
          opacity: hov ? 1 : 0.45,
          transition: "opacity 0.6s var(--ease-out)",
        }} />

        {/* Gradient fade */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "100px",
          background: "linear-gradient(to top, var(--bg), transparent)",
          pointerEvents: "none",
        }} />

        {/* Text */}
        <div style={{ padding: "0 24px 28px" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: "10px",
          }}>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: "0.55rem",
              letterSpacing: "0.2em", color: "var(--muted)", textTransform: "uppercase",
            }}>{project.idx}</span>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: "0.9rem",
              color: hov ? "var(--white)" : "var(--muted)",
              transition: "color 0.2s, transform 0.2s",
              transform: hov ? "translate(3px,-3px)" : "none",
              display: "inline-block",
            }}>↗</span>
          </div>

          <div style={{
            fontFamily: "var(--font-disp)",
            fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
            fontWeight: 700, lineHeight: 1.02,
            letterSpacing: "-0.01em", textTransform: "uppercase",
            color: "var(--white)", whiteSpace: "pre-line",
            marginBottom: "10px",
          }}>{project.title}</div>

          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "0.65rem",
            color: "var(--sub)", lineHeight: 1.55, marginBottom: "14px",
          }}>{project.sub}</div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {project.tags.map((t: string) => (
              <span key={t} style={{
                fontFamily: "var(--font-mono)", fontSize: "0.52rem",
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: "var(--muted)", border: "1px solid var(--line2)",
                padding: "2px 8px",
              }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Hover border */}
        <div style={{
          position: "absolute", inset: 0,
          border: `1px solid ${hov ? "var(--white)" : "transparent"}`,
          transition: "border-color 0.25s",
          pointerEvents: "none",
        }} />
      </div>
    </Wrap>
  );
}
