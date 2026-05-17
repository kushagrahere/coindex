import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function CosmicCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas: el,
      antialias: false,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x04040d, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // ── Scene & Camera ────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 150);

    // ── Fog ───────────────────────────────────────────────────────────────
    scene.fog = new THREE.FogExp2(0x04040d, 0.0012);

    // ── Star Field ────────────────────────────────────────────────────────
    const starCount   = 8000;
    const starGeo     = new THREE.BufferGeometry();
    const starPos     = new Float32Array(starCount * 3);
    const starSizes   = new Float32Array(starCount);
    const starColors  = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 300 + Math.random() * 700;
      starPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);
      starSizes[i] = 0.5 + Math.random() * 1.5;

      // Slight color variance: white, blue-white, lavender
      const t = Math.random();
      starColors[i * 3]     = 0.85 + t * 0.15;
      starColors[i * 3 + 1] = 0.85 + t * 0.1;
      starColors[i * 3 + 2] = 1.0;
    }

    starGeo.setAttribute('position',  new THREE.BufferAttribute(starPos,    3));
    starGeo.setAttribute('size',      new THREE.BufferAttribute(starSizes,  1));
    starGeo.setAttribute('color',     new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.2,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });

    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ── Nebula Glow (soft sprite behind orb) ─────────────────────────────
    const glowGeo  = new THREE.SphereGeometry(42, 32, 32);
    const glowMat  = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.04,
      side: THREE.FrontSide,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.position.set(55, 0, -20);
    scene.add(glowMesh);

    // ── Particle Orb (crypto sphere) ──────────────────────────────────────
    const orbCount  = 4000;
    const orbGeo    = new THREE.BufferGeometry();
    const orbPos    = new Float32Array(orbCount * 3);
    const orbColors = new Float32Array(orbCount * 3);

    const violet = new THREE.Color(0x7c3aed);
    const cyan   = new THREE.Color(0x06b6d4);
    const gold   = new THREE.Color(0xf59e0b);

    for (let i = 0; i < orbCount; i++) {
      // Fibonacci sphere distribution — perfectly uniform
      const offset    = 2 / orbCount;
      const increment = Math.PI * (3 - Math.sqrt(5));
      const y  = i * offset - 1 + offset / 2;
      const r  = Math.sqrt(1 - y * y);
      const phi2 = ((i % orbCount) * increment);
      const R  = 38 + (Math.random() - 0.5) * 8;

      orbPos[i * 3]     = Math.cos(phi2) * r * R;
      orbPos[i * 3 + 1] = y * R;
      orbPos[i * 3 + 2] = Math.sin(phi2) * r * R;

      // Color: gradient from violet (top) → cyan (equator) → gold (hints)
      const t = (y + 1) / 2;
      const col = t > 0.5 ? violet.clone().lerp(cyan, (t - 0.5) * 2)
                           : cyan.clone().lerp(gold, (0.5 - t) * 0.6);
      orbColors[i * 3]     = col.r;
      orbColors[i * 3 + 1] = col.g;
      orbColors[i * 3 + 2] = col.b;
    }

    orbGeo.setAttribute('position', new THREE.BufferAttribute(orbPos,    3));
    orbGeo.setAttribute('color',    new THREE.BufferAttribute(orbColors, 3));

    const orbMat = new THREE.PointsMaterial({
      size: 0.9,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const orb = new THREE.Points(orbGeo, orbMat);
    orb.position.set(55, 0, -20);
    scene.add(orb);

    // ── Inner core (bright center) ────────────────────────────────────────
    const coreGeo  = new THREE.SphereGeometry(8, 16, 16);
    const coreMat  = new THREE.MeshBasicMaterial({
      color: 0xa78bfa,
      transparent: true,
      opacity: 0.12,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.copy(orb.position);
    scene.add(core);

    // ── Ring particles (equatorial band) ─────────────────────────────────
    const ringCount = 600;
    const ringGeo   = new THREE.BufferGeometry();
    const ringPos   = new Float32Array(ringCount * 3);
    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2;
      const R = 50 + Math.random() * 10;
      ringPos[i * 3]     = Math.cos(angle) * R;
      ringPos[i * 3 + 1] = (Math.random() - 0.5) * 4;
      ringPos[i * 3 + 2] = Math.sin(angle) * R;
    }
    ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3));
    const ringMat = new THREE.PointsMaterial({
      color: 0x06b6d4,
      size: 0.5,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Points(ringGeo, ringMat);
    ring.position.copy(orb.position);
    scene.add(ring);

    // ── Mouse Parallax ────────────────────────────────────────────────────
    const mouse  = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const onMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    // ── Resize ────────────────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Animation Loop ────────────────────────────────────────────────────
    let frameId;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Star field slow rotation
      stars.rotation.y += 0.00004;
      stars.rotation.x += 0.00001;

      // Orb rotation & pulse
      orb.rotation.y  += 0.003;
      orb.rotation.x  += 0.001;
      ring.rotation.y -= 0.005;
      ring.rotation.x  = Math.sin(t * 0.3) * 0.1;

      // Glow pulse
      glowMesh.material.opacity = 0.03 + Math.sin(t * 0.8) * 0.015;
      core.material.opacity     = 0.08 + Math.sin(t * 1.2) * 0.05;

      // Camera parallax (smooth lerp)
      target.x += (mouse.x * 8 - target.x) * 0.04;
      target.y += (mouse.y * 5 - target.y) * 0.04;
      camera.position.x = target.x;
      camera.position.y = target.y;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      starGeo.dispose();  starMat.dispose();
      orbGeo.dispose();   orbMat.dispose();
      ringGeo.dispose();  ringMat.dispose();
      glowGeo.dispose();  glowMat.dispose();
      coreGeo.dispose();  coreMat.dispose();
    };
  }, []);

  return <canvas id="cosmic-canvas" ref={mountRef} />;
}
