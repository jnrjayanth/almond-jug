'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { DoubleSide, MathUtils, Plane, Vector2, Vector3 } from 'three';
import type { Mesh } from 'three';

// Almond silhouette as [radius, height], revolved then flattened.
const PROFILE: [number, number][] = [
  [0, 0],
  [0.3, 0.04],
  [0.55, 0.18],
  [0.73, 0.5],
  [0.8, 0.9],
  [0.79, 1.25],
  [0.71, 1.6],
  [0.56, 1.95],
  [0.36, 2.25],
  [0.16, 2.44],
  [0, 2.5],
];

const HEIGHT = 2.5;
const Y_OFFSET = -HEIGHT / 2;
const FLATTEN = 0.58; // almonds are not round in cross-section
const WATER_MIN = 0.01;
const WATER_MAX = 2.42;
const INSET = 0.94;

function radiusAt(y: number) {
  for (let i = 1; i < PROFILE.length; i++) {
    const [r0, y0] = PROFILE[i - 1];
    const [r1, y1] = PROFILE[i];
    if (y <= y1) {
      const t = y1 === y0 ? 0 : (y - y0) / (y1 - y0);
      return r0 + (r1 - r0) * t;
    }
  }
  return 0;
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
    plane.constant = level + Y_OFFSET;
    if (surface.current) {
      surface.current.position.y = level - 0.002;
      const r = Math.max(radiusAt(level) * INSET, 0.001);
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
          opacity={0.92}
          roughness={0.2}
          side={DoubleSide}
          clippingPlanes={[plane]}
        />
      </mesh>
      <mesh ref={surface} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[1, 64]} />
        <meshPhysicalMaterial color="#6cbcf5" side={DoubleSide} roughness={0.1} />
      </mesh>
    </group>
  );
}

function Shell() {
  const points = useMemo(() => PROFILE.map(([r, y]) => new Vector2(r, y)), []);
  return (
    <mesh>
      <latheGeometry args={[points, 64]} />
      <meshPhysicalMaterial
        color="#c89a6b"
        transparent
        opacity={0.42}
        roughness={0.55}
        side={DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function Almond3D({ fillPercent }: { fillPercent: number }) {
  const fill = MathUtils.clamp(fillPercent / 100, 0, 1);
  const plane = useMemo(() => new Plane(new Vector3(0, -1, 0), 0), []);

  return (
    <div className="h-64 w-full">
      <Canvas
        gl={{ localClippingEnabled: true }}
        camera={{ position: [0, 0, 5.2], fov: 35 }}
      >
        <ambientLight intensity={0.75} />
        <directionalLight position={[3, 5, 4]} intensity={1.2} />
        <directionalLight position={[-3, 1, -2]} intensity={0.35} />
        <group position-y={Y_OFFSET} scale-z={FLATTEN}>
          <Water fill={fill} plane={plane} />
          <Shell />
        </group>
      </Canvas>
    </div>
  );
}