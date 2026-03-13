"use client";

import { useEffect, useRef } from "react";

interface Props {
  predClass?: 0 | 1 | 2;
  scrollY?:   number;
}

const PAL = [
  [[0.08,0.45,0.40],[0.04,0.28,0.52],[0.12,0.52,0.48]],
  [[0.65,0.45,0.08],[0.80,0.60,0.04],[0.55,0.35,0.06]],
  [[0.80,0.12,0.15],[0.90,0.28,0.08],[0.70,0.08,0.10]],
];

export default function ParticleCanvas({ predClass = 0, scrollY = 0 }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const stateRef   = useRef({ cur: 0, transT: 1.0, scrollY: 0 });
  const threeRef   = useRef<any>(null);
  const rafRef     = useRef<number>(0);

  useEffect(() => { stateRef.current.scrollY = scrollY; }, [scrollY]);

  useEffect(() => {
    const s = stateRef.current;
    const t = threeRef.current;
    if (predClass === s.cur && s.transT >= 1) return;
    if (t) {
      for (let i = 0; i < t.N * 3; i++) t.from[i] = t.pos[i];
      buildTo(predClass, t.to_, t.N);
      recolour(predClass, t.pcol, t.N);
      t.geo.attributes.pColor.needsUpdate = true;
    }
    s.cur = predClass;
    s.transT = 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predClass]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let disposed = false;

    import("three").then((THREE) => {
      if (disposed) return;
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x050505, 1);

      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 80;

      const N    = 2400;
      const pos  = new Float32Array(N * 3);
      const vel  = new Float32Array(N * 3);
      const pcol = new Float32Array(N * 3);
      const psz  = new Float32Array(N);
      const from = new Float32Array(N * 3);
      const to_  = new Float32Array(N * 3);

      for (let i = 0; i < N; i++) {
        pos[i*3]   = (Math.random()-.5)*180;
        pos[i*3+1] = (Math.random()-.5)*100;
        pos[i*3+2] = (Math.random()-.5)*80;
        vel[i*3]   = (Math.random()-.5)*.035;
        vel[i*3+1] = (Math.random()-.5)*.035;
        vel[i*3+2] = (Math.random()-.5)*.018;
        const c = rc(0);
        pcol[i*3]=c[0]; pcol[i*3+1]=c[1]; pcol[i*3+2]=c[2];
        psz[i] = 0.7 + Math.random() * 2.0;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos,  3));
      geo.setAttribute("pColor",   new THREE.BufferAttribute(pcol, 3));
      geo.setAttribute("pSize",    new THREE.BufferAttribute(psz,  1));

      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
          attribute float pSize; attribute vec3 pColor;
          varying vec3 vCol; varying float vA;
          uniform float uTime;
          void main(){
            vCol=pColor;
            float p=0.82+0.18*sin(uTime*1.1+position.x*0.05+position.y*0.05);
            vA=p;
            vec4 mv=modelViewMatrix*vec4(position,1.0);
            gl_PointSize=pSize*p*(280.0/-mv.z);
            gl_Position=projectionMatrix*mv;
          }`,
        fragmentShader: `
          varying vec3 vCol; varying float vA;
          void main(){
            vec2 uv=gl_PointCoord-0.5; float r=length(uv);
            float g=1.0-smoothstep(0.0,0.5,r);
            float c=1.0-smoothstep(0.0,0.2,r);
            gl_FragColor=vec4(vCol,(g*.3+c*.7)*vA*0.62);
          }`,
        transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const pts = new THREE.Points(geo, mat);
      scene.add(pts);
      threeRef.current = { N, pos, vel, pcol, psz, from, to_, geo, mat };

      let mx = 0, my = 0;
      const onMove   = (e: MouseEvent) => { mx=(e.clientX/window.innerWidth-.5)*2; my=(e.clientY/window.innerHeight-.5)*2; };
      const onResize = () => {
        camera.aspect = window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("resize",    onResize);

      const clock = new THREE.Clock();
      function loop() {
        rafRef.current = requestAnimationFrame(loop);
        if (disposed) return;
        const t  = clock.getElapsedTime();
        const sr = stateRef.current;
        mat.uniforms.uTime.value = t;

        if (sr.transT < 1) {
          sr.transT = Math.min(sr.transT + 0.012, 1);
          const e_ = ease(sr.transT);
          for (let i = 0; i < N * 3; i++) pos[i] = from[i] + (to_[i] - from[i]) * e_;
        }

        const sd = sr.scrollY * 0.012;
        for (let i = 0; i < N; i++) {
          const ix=i*3,iy=ix+1,iz=ix+2, cs=sr.cur;
          if (cs===0) {
            pos[ix]+=vel[ix]*.45; pos[iy]+=vel[iy]*.45-sd*0.002; pos[iz]+=vel[iz]*.18;
            if(Math.abs(pos[ix])>90) vel[ix]*=-1;
            if(Math.abs(pos[iy])>52) vel[iy]*=-1;
          } else if (cs===1) {
            pos[ix]+=vel[ix]*1.1+Math.sin(t*.7+i*.05)*.035;
            pos[iy]+=vel[iy]*1.1+Math.cos(t*.8+i*.05)*.035-sd*.003;
            pos[iz]+=vel[iz]*.55;
            if(Math.abs(pos[ix])>75) vel[ix]*=-1;
            if(Math.abs(pos[iy])>42) vel[iy]*=-1;
          } else {
            const px=pos[ix],py=pos[iy],r=Math.sqrt(px*px+py*py)+.001;
            pos[ix]+=vel[ix]*2-py/r*.55+Math.sin(t*2+i)*.055;
            pos[iy]+=vel[iy]*2+px/r*.55+Math.cos(t*2+i)*.055-sd*.004;
            pos[iz]+=vel[iz]*.75;
            if(r>72){vel[ix]*=-.9;vel[iy]*=-.9;}
          }
        }

        geo.attributes.position.needsUpdate = true;
        camera.position.x += (mx*5 - camera.position.x)*.04;
        camera.position.y += (-my*3 - camera.position.y)*.04;
        camera.lookAt(scene.position);
        pts.rotation.z += sr.cur===2 ? .0014 : .0003;
        renderer.render(scene, camera);
      }
      loop();

      return () => {
        disposed = true;
        cancelAnimationFrame(rafRef.current);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("resize",    onResize);
        renderer.dispose();
      };
    });

    return () => { disposed = true; cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: "fixed", top: 0, left: 0,
      width: "100%", height: "100%",
      zIndex: 0, pointerEvents: "none",
    }} />
  );
}

function rc(s: number): [number,number,number] {
  const p=PAL[s], c=p[Math.floor(Math.random()*p.length)];
  return c.map(v=>Math.max(0,Math.min(1,v+(Math.random()-.5)*.14))) as [number,number,number];
}
function recolour(s: number, pcol: Float32Array, N: number) {
  for(let i=0;i<N;i++){const c=rc(s);pcol[i*3]=c[0];pcol[i*3+1]=c[1];pcol[i*3+2]=c[2];}
}
function buildTo(s: number, to_: Float32Array, N: number) {
  for(let i=0;i<N;i++){
    let x=0,y=0,z=0;
    if(s===0){x=(Math.random()-.5)*180;y=(Math.random()-.5)*100;z=(Math.random()-.5)*80;}
    else if(s===1){const cx=(Math.random()-.5)*100,cy=(Math.random()-.5)*55;x=cx+(Math.random()-.5)*26;y=cy+(Math.random()-.5)*26;z=(Math.random()-.5)*58;}
    else{const t=Math.random()*Math.PI*8,r=10+Math.random()*50;x=Math.cos(t)*r;y=Math.sin(t)*r+(Math.random()-.5)*16;z=(Math.random()-.5)*45;}
    to_[i*3]=x;to_[i*3+1]=y;to_[i*3+2]=z;
  }
}
function ease(t: number) { return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; }
