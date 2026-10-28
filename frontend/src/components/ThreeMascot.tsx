import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ThreeMascotProps {
  liveHz: number;
  liveRms: number;
  mode?: 'idle' | 'listening' | 'singing' | 'celebrating';
}

export const ThreeMascot: React.FC<ThreeMascotProps> = ({
  liveHz,
  liveRms,
  mode = 'idle',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [interactiveSpin, setInteractiveSpin] = useState<boolean>(false);
  const [pulseCount, setPulseCount] = useState<number>(0);

  const stateRef = useRef({
    liveHz,
    liveRms,
    mode,
    interactiveSpin,
    pulseEnergy: 0,
    mouseX: 0,
    mouseY: 0,
  });

  useEffect(() => {
    stateRef.current.liveHz = liveHz;
    stateRef.current.liveRms = liveRms;
    stateRef.current.mode = mode;
    stateRef.current.interactiveSpin = interactiveSpin;
  }, [liveHz, liveRms, mode, interactiveSpin]);

  const triggerSonicPulse = () => {
    stateRef.current.pulseEnergy = 1.25;
    setPulseCount((c) => c + 1);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 440;
    const height = 390;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.15, 7.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.05));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const cyanLight = new THREE.PointLight(0x00f0ff, 6, 18);
    cyanLight.position.set(3.5, 2.5, 4.5);
    scene.add(cyanLight);

    const blueLight = new THREE.PointLight(0x1d63ff, 5, 18);
    blueLight.position.set(-3.5, -2.0, 4.0);
    scene.add(blueLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 1. Centerpiece: Sculpted 3D Ace of Spades (Vocal4Ace Emblem)
    const spadeShape = new THREE.Shape();
    spadeShape.moveTo(0, 1.32);
    spadeShape.bezierCurveTo(0.55, 0.72, 1.12, 0.18, 1.12, -0.35);
    spadeShape.bezierCurveTo(1.12, -0.82, 0.62, -1.02, 0.2, -0.7);
    spadeShape.lineTo(0.38, -1.32);
    spadeShape.lineTo(-0.38, -1.32);
    spadeShape.lineTo(-0.2, -0.7);
    spadeShape.bezierCurveTo(-0.62, -1.02, -1.12, -0.82, -1.12, -0.35);
    spadeShape.bezierCurveTo(-1.12, 0.18, -0.55, 0.72, 0, 1.32);

    const spadeGeo = new THREE.ExtrudeGeometry(spadeShape, {
      depth: 0.26,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.07,
      bevelThickness: 0.07,
    });
    spadeGeo.center();

    const spadeMat = new THREE.MeshPhysicalMaterial({
      color: 0x0e223d,
      metalness: 0.75,
      roughness: 0.2,
      clearcoat: 1.0,
      emissive: 0x00a8cc,
      emissiveIntensity: 0.32,
    });
    const spadeMesh = new THREE.Mesh(spadeGeo, spadeMat);
    rootGroup.add(spadeMesh);

    const spadeWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(spadeGeo, 15),
      new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.75 })
    );
    spadeWire.scale.set(1.02, 1.02, 1.02);
    spadeMesh.add(spadeWire);

    // 2. Helper to build Left & Right 3D Studio Condenser Microphones (Matches VOCAL4ACE Logo)
    const createStudioMicrophone = (isLeft: boolean): THREE.Group => {
      const micGroup = new THREE.Group();

      // Metallic Body Tube
      const bodyGeo = new THREE.CylinderGeometry(0.26, 0.21, 1.05, 28);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: isLeft ? 0xe2e8f0 : 0x00d2ff,
        metalness: 0.85,
        roughness: 0.2,
      });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      micGroup.add(bodyMesh);

      // Glowing Collar Ring
      const ringGeo = new THREE.TorusGeometry(0.27, 0.035, 16, 40);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.8,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 0.52;
      micGroup.add(ringMesh);

      // Capsule Mesh Grille (Top)
      const grilleGeo = new THREE.SphereGeometry(0.27, 24, 20);
      grilleGeo.scale(1, 1.25, 1);
      const grilleMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.9,
        roughness: 0.15,
        wireframe: false,
      });
      const grilleMesh = new THREE.Mesh(grilleGeo, grilleMat);
      grilleMesh.position.y = 0.72;
      micGroup.add(grilleMesh);

      // Wireframe Mesh Cage Overlay on Capsule
      const cageMesh = new THREE.Mesh(
        grilleGeo,
        new THREE.MeshBasicMaterial({
          color: 0x00f0ff,
          wireframe: true,
          transparent: true,
          opacity: 0.38,
        })
      );
      cageMesh.position.y = 0.72;
      cageMesh.scale.set(1.02, 1.02, 1.02);
      micGroup.add(cageMesh);

      // Curved Swoop Arm Underneath (Connecting to Spade Base)
      const armGeo = new THREE.TorusGeometry(0.55, 0.055, 16, 40, Math.PI * 0.85);
      const armMat = new THREE.MeshStandardMaterial({
        color: isLeft ? 0xcbd5e1 : 0x00f0ff,
        metalness: 0.8,
        roughness: 0.2,
      });
      const armMesh = new THREE.Mesh(armGeo, armMat);
      armMesh.position.set(isLeft ? 0.35 : -0.35, -0.55, 0);
      armMesh.rotation.z = isLeft ? Math.PI * 0.95 : -Math.PI * 0.1;
      micGroup.add(armMesh);

      // Position & tilt outward like the VOCAL4ACE logo
      micGroup.position.set(isLeft ? -1.18 : 1.18, 0.22, 0.22);
      micGroup.rotation.z = isLeft ? 0.42 : -0.42;
      return micGroup;
    };

    const leftMic = createStudioMicrophone(true);
    const rightMic = createStudioMicrophone(false);
    rootGroup.add(leftMic);
    rootGroup.add(rightMic);

    // 3. Live 3D Acoustic Waveform Ribbon Across the Front of the Spade & Mics
    const waveBarCount = 31;
    const waveNodes: THREE.Mesh[] = [];
    const nodeGeo = new THREE.BoxGeometry(0.085, 0.38, 0.14);

    for (let i = 0; i < waveBarCount; i++) {
      const norm = (i / (waveBarCount - 1)) * 2 - 1; // -1 to +1
      const nodeMat = new THREE.MeshStandardMaterial({
        color: norm < 0 ? 0x38bdf8 : 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.85,
      });
      const bar = new THREE.Mesh(nodeGeo, nodeMat);
      bar.position.set(norm * 1.95, -0.08, 0.48);
      rootGroup.add(bar);
      waveNodes.push(bar);
    }

    // 4. Outer Acoustic Halo Ring & 36 Equalizer Bars
    const outerRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.25, 0.025, 20, 120),
      new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.6,
      })
    );
    outerRing.rotation.x = Math.PI / 3.2;
    rootGroup.add(outerRing);

    const eqBars: THREE.Mesh[] = [];
    const barCount = 36;
    const radius = 2.48;
    const barGeo = new THREE.BoxGeometry(0.055, 0.24, 0.055);

    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2;
      const barMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x00f0ff : 0x2dd4bf,
        emissive: i % 2 === 0 ? 0x00f0ff : 0x2dd4bf,
        emissiveIntensity: 0.55,
      });
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, -0.15);
      bar.rotation.z = angle + Math.PI / 2;
      rootGroup.add(bar);
      eqBars.push(bar);
    }

    // Mouse Tilt Handler
    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      stateRef.current.mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      stateRef.current.mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    window.addEventListener('mousemove', onPointerMove);

    const onResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 440;
      camera.aspect = newW / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, height);
    };
    window.addEventListener('resize', onResize);

    // 60FPS Animation Loop with Smooth Delta Orbit
    let frameId = 0;
    let lastTime = performance.now();
    let orbitAngle = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const t = now * 0.001;

      const { liveHz: hz, liveRms: rms, interactiveSpin: spin } = stateRef.current;
      const boost = stateRef.current.pulseEnergy;
      const activeEnergy = Math.min(1.4, rms * 14 + boost + (hz > 0 ? 0.45 : 0.1));

      // Smooth Orbit vs Mouse Tilt (No violent spinning!)
      if (spin) {
        orbitAngle += dt * 0.85; // Calm, steady 360 showcase rotation
      } else {
        // Gently ease orbitAngle back toward 0 when orbit is turned off
        orbitAngle = orbitAngle % (Math.PI * 2);
        if (orbitAngle > Math.PI) orbitAngle -= Math.PI * 2;
        orbitAngle *= 0.92;
      }

      const targetRotY = orbitAngle + stateRef.current.mouseX * 0.35;
      const targetRotX = -stateRef.current.mouseY * 0.22 + Math.cos(t * 1.1) * 0.06;

      rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.1;
      rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.1;
      rootGroup.position.y = Math.sin(t * 1.8) * 0.07;

      // Pulse Dual Microphones & Ace Core on Sonic Pulse / Voice Input
      const scalePulse = 1 + activeEnergy * 0.12;
      spadeMesh.scale.set(scalePulse, scalePulse, scalePulse);
      leftMic.position.y = 0.22 + Math.sin(t * 3.5) * 0.04 + activeEnergy * 0.08;
      rightMic.position.y = 0.22 + Math.cos(t * 3.5) * 0.04 + activeEnergy * 0.08;
      spadeMat.emissiveIntensity = 0.28 + activeEnergy * 0.75;

      // Animate Center 3D Waveform Ribbon (Matches Logo's ECG/Soundwave)
      for (let i = 0; i < waveNodes.length; i++) {
        const wBar = waveNodes[i];
        const centerWeight = 1 - Math.abs((i / (waveNodes.length - 1)) * 2 - 1);
        const waveHeight =
          0.25 +
          centerWeight * (0.55 + activeEnergy * 1.85) * Math.abs(Math.sin(t * 6.5 - i * 0.45));
        wBar.scale.y = waveHeight;
      }

      // Animate Outer 36 Equalizer Bars
      outerRing.rotation.z = t * 0.35;
      for (let i = 0; i < eqBars.length; i++) {
        const bar = eqBars[i];
        const wave = Math.abs(Math.sin(t * 4.2 + i * 0.4)) * (0.35 + activeEnergy * 1.8);
        bar.scale.y = Math.max(0.25, wave);
      }

      if (stateRef.current.pulseEnergy > 0) {
        stateRef.current.pulseEnergy = Math.max(0, stateRef.current.pulseEnergy - dt * 1.8);
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative rounded-3xl bg-gradient-to-b from-[#0C1829]/95 to-[#070B12]/95 border border-cyan-500/25 p-5 shadow-2xl overflow-hidden">
      {/* Top Interactive Controls Bar */}
      <div className="flex items-center justify-between z-20 relative">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-300">
            VOCAL4ACE 3D STUDIO • {liveHz > 0 ? `${Math.round(liveHz)} Hz` : 'DUAL-MIC DSP'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={triggerSonicPulse}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 active:scale-95 border border-cyan-400/40 text-xs font-bold text-cyan-200 transition cursor-pointer"
          >
            Sonic Pulse {pulseCount > 0 ? `(${pulseCount})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setInteractiveSpin((prev) => !prev)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              interactiveSpin
                ? 'bg-teal-400 text-slate-950 border-teal-300 shadow-lg shadow-teal-400/20'
                : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            {interactiveSpin ? 'Stop Orbit' : '360° Orbit'}
          </button>
        </div>
      </div>

      {/* 3D WebGL Stage */}
      <div
        ref={mountRef}
        className="w-full h-[380px] flex items-center justify-center cursor-grab active:cursor-grabbing"
      />

      {/* Bottom Caption */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-3">
        <span>3D Dual Condenser Mics + Live Waveform Ribbon</span>
        <span className="text-teal-300">Reacts to Mic Hz & Audio</span>
      </div>
    </div>
  );
};