'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import { DoubleSide, MathUtils, Plane, Vector2, Vector3 } from 'three';
import type { Mesh } from 'three';

// Jug profile as [radius, height] pairs from bottom to top, revolved around Y.
// Edit these points to change the jug's shape; the water follows automatically.
const PROFILE: [number, number][] = [
  [0, 0],
  [0.78, 0],
  [0.9, 0.12],
  [0.9, 1.45],
  [0.78, 1.7],
  [0.42, 1.95],
  [0.32, 2.05],
  [0.32, 2.35],
  [0.36, 2.35],
  [0.36, 2.5],
];

const HEIGHT = 2.5;
const Y_OFFSET = -HEIGHT / 2; // centre the jug on the origin
const WATER_MIN = 0.02; // just above the base
const WATER_MAX = 2.0; // just below the neck (counts as "full")
const INSET = 0.96; // water sits slightly inside the glass

// Radius of the body at a given height, interpolated from the profile.
function radiusAt(y: number) {
  for (let i = 1; i < PROFILE.length; i++) {
    const [r0, y0] = PROFILE[i - 1];
    const [r1, y1] = PROFILE[i];
    if (y <= y1) {
      const t = y1 === y0 ? 0 : (y - y0) / (y1 - y0);
      return r0 + (r1 - r0) * t;
    }
  }
  return PROFILE[PROFILE.length - 1][0];
}

function Water({ fill, plane }: { fill: number; plane: Plane }) {
  const surface = useRef<Mesh>(null);
  const current = useRef(0);
  const points = useMemo(
    () => PROFILE.map(([r, y]) => new Vector2(r * INSET, y)),
    []
  );

  useFrame((_, delta) => {
    current.current = MathUtils.damp(current.current, fill, 4, delta);
    const level = WATER_MIN + current.current * (WATER_MAX - WATER_MIN);
    plane.constant = level + Y_OFFSET; // clipping planes work in world space
    if (surface.current) {
      surface.current.position.y = level - 0.002;
      const r = radiusAt(level) * INSET;
      surface.current.scale.set(r, r, 1);
    }
  });

  return (
    <group>
      <mesh>
        <latheGeometry args={[points, 64]} />
        <meshPhysicalMaterial
          color="#2f8fdc"
          transparent
          opacity={0.9}
          roughness={0.2}
          side={DoubleSide}
          clippingPlanes={[plane]}
        />
      </mesh>
      <mesh ref={surface} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[1, 64]} />
        <meshPhysicalMaterial
          color="#6cbcf5"
          transparent
          opacity={0.9}
          roughness={0.1}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

function JugShell() {
  const points = useMemo(() => PROFILE.map(([r, y]) => new Vector2(r, y)), []);

  return (
    <group>
      {/* Glass body */}
      <mesh renderOrder={2}>
        <latheGeometry args={[points, 64]} />
        <meshPhysicalMaterial
          color="#dff0ff"
          transparent
          opacity={0.3}
          roughness={0.05}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Cap */}
      <mesh position-y={2.6}>
        <cylinderGeometry args={[0.4, 0.4, 0.2, 48]} />
        <meshStandardMaterial color="#d9534f" />
      </mesh>
      {/* Handle */}
      <mesh position={[0.95, 1.85, 0]} rotation-z={0.15}>
        <torusGeometry args={[0.32, 0.07, 16, 48]} />
        <meshStandardMaterial color="#cfe3f5" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

export default function Jug3D({ fillPercent }: { fillPercent: number }) {
  const fill = MathUtils.clamp(fillPercent / 100, 0, 1);
  const plane = useMemo(() => new Plane(new Vector3(0, -1, 0), 0), []);

  return (
    <div className="h-72 w-full">
      <Canvas
        gl={{ localClippingEnabled: true }}
        camera={{ position: [0, 0.6, 6], fov: 35 }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 4]} intensity={1.3} />
        <directionalLight position={[-3, 2, -2]} intensity={0.4} />
        <group position-y={Y_OFFSET}>
          <Water fill={fill} plane={plane} />
          <JugShell />
        </group>
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}