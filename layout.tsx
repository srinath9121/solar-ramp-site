import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:       "Solar Ramp Detector — V2",
  description: "Deep learning system for detecting severe solar PV ramp events. ResNet-18 + LSTM, 80.5% severe recall on 169,372 unseen sky images.",
  openGraph: {
    title:       "Solar Ramp Detector — V2",
    description: "Real-time severe ramp event detection. SKIPPD dataset, physics-constrained multi-task learning.",
    type:        "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Grain overlay */}
        <div id="grain" aria-hidden="true" />

        {/* Custom cursor */}
        <div id="cursor" aria-hidden="true" />

        {/* Scroll progress */}
        <div id="scroll-bar" aria-hidden="true">
          <div id="scroll-bar-fill" />
        </div>

        {children}

        {/* Global cursor + scroll tracking */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            const cursor = document.getElementById('cursor');
            const fill   = document.getElementById('scroll-bar-fill');
            let cx = window.innerWidth/2, cy = window.innerHeight/2;
            let tx = cx, ty = cy;

            document.addEventListener('mousemove', e => {
              tx = e.clientX; ty = e.clientY;
              cursor.style.left = tx + 'px';
              cursor.style.top  = ty + 'px';
            });

            document.addEventListener('mouseover', e => {
              const el = e.target;
              if(el && (el.tagName === 'A' || el.tagName === 'BUTTON' ||
                 el.closest('a') || el.closest('button'))) {
                cursor.classList.add('hovering');
              } else {
                cursor.classList.remove('hovering');
              }
            });

            window.addEventListener('scroll', () => {
              const h = document.body.scrollHeight - window.innerHeight;
              const p = h > 0 ? (window.scrollY / h) * 100 : 0;
              fill.style.width = p + '%';
            }, { passive: true });
          })();
        `}} />
      </body>
    </html>
  );
}
