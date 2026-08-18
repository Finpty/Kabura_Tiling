"use client";

/* eslint-disable react-hooks/immutability --
 * react-three-fiber drives animation by mutating three.js objects inside its
 * per-frame callback, deliberately outside React's render cycle: a scene that
 * re-rendered React on every frame would be unusable. `useFrame` bodies
 * therefore assign to mesh, group and camera transforms directly, which is the
 * documented pattern for this library and cannot be expressed immutably.
 */

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { TextureLoader } from "three";
import { SLAB_LAYERS, type SlabLayer } from "./layers";

export { SLAB_LAYERS, type SlabLayer };

/**
 * The interactive slab.
 *
 * A large-format slab floats and responds to the pointer; as `progress` rises
 * it separates into the five layers that sit under a finished tile. The
 * separation is real geometry moving in 3D — the labels are HTML rendered
 * outside the canvas, which keeps them selectable, translatable and readable by
 * assistive technology.
 *
 * Lighting is a locally generated environment (drei `Lightformer`s rendered into
 * a cube target) rather than a downloaded HDR, so nothing is fetched at runtime.
 */

const W = 3.1;
const D = 2.0;

function Layer({
  layer,
  index,
  progress,
  map,
}: {
  layer: SlabLayer;
  index: number;
  progress: React.RefObject<number>;
  map: THREE.Texture;
}) {
  const mesh = useRef<THREE.Mesh>(null);

  /* Resting y so the stack reads as a solid build-up before it separates. */
  const restY = useMemo(() => {
    let y = 0;
    for (let i = 0; i < index; i += 1) y -= SLAB_LAYERS[i].thickness;
    return y;
  }, [index]);

  useFrame((_, delta) => {
    const node = mesh.current;
    if (!node) return;

    const p = progress.current ?? 0;
    const spread = index * 0.62 * p;
    const targetY = restY - spread;
    const targetTilt = 0.16 * p;

    node.position.y = THREE.MathUtils.damp(node.position.y, targetY, 4, delta);
    node.rotation.x = THREE.MathUtils.damp(
      node.rotation.x,
      -targetTilt,
      4,
      delta,
    );
    // Deeper layers slide back a little, opening the stack up to the camera.
    node.position.z = THREE.MathUtils.damp(
      node.position.z,
      index * 0.1 * p,
      4,
      delta,
    );

    const material = node.material as THREE.MeshStandardMaterial;
    material.opacity = THREE.MathUtils.damp(
      material.opacity,
      index === 0 ? 1 : 0.35 + 0.65 * p,
      5,
      delta,
    );
  });

  const isTile = index === 0;

  return (
    <mesh ref={mesh} position={[0, restY, 0]} castShadow receiveShadow>
      <boxGeometry args={[W, layer.thickness, D]} />
      <meshStandardMaterial
        color={layer.colour}
        map={isTile ? map : undefined}
        roughness={layer.roughness}
        metalness={layer.metalness}
        transparent
        opacity={1}
        envMapIntensity={isTile ? 1.05 : 0.35}
      />
    </mesh>
  );
}

function Rig({
  progress,
  pointer,
  textureUrl,
}: {
  progress: React.RefObject<number>;
  pointer: React.RefObject<{ x: number; y: number }>;
  textureUrl: string;
}) {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const map = useLoader(TextureLoader, textureUrl);

  useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = THREE.ClampToEdgeWrapping;
    map.wrapT = THREE.ClampToEdgeWrapping;
    map.anisotropy = 8;
  }, [map]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;

    const t = state.clock.elapsedTime;
    const p = progress.current ?? 0;
    const { x, y } = pointer.current ?? { x: 0, y: 0 };

    // Pointer tilts the slab; the drift keeps it alive when the pointer is still.
    g.rotation.y = THREE.MathUtils.damp(
      g.rotation.y,
      x * 0.42 + Math.sin(t * 0.22) * 0.06 - p * 0.22,
      3,
      delta,
    );
    g.rotation.x = THREE.MathUtils.damp(
      g.rotation.x,
      -y * 0.24 + Math.sin(t * 0.17) * 0.03 + p * 0.34,
      3,
      delta,
    );
    g.position.y = THREE.MathUtils.damp(
      g.position.y,
      Math.sin(t * 0.5) * 0.05 + p * 0.55,
      3,
      delta,
    );

    // The camera answers the pointer a fraction of the amount the slab does.
    camera.position.x = THREE.MathUtils.damp(camera.position.x, x * 0.5, 2.5, delta);
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      1.1 + y * 0.32,
      2.5,
      delta,
    );
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={group}>
      {SLAB_LAYERS.map((layer, index) => (
        <Layer key={layer.id} layer={layer} index={index} progress={progress} map={map} />
      ))}
    </group>
  );
}

type Props = {
  progress: React.RefObject<number>;
  /** Slab face texture. Comes from the media manifest, so it is always present. */
  textureUrl: string;
  className?: string;
};

export default function SlabScene({ progress, textureUrl, className }: Props) {
  const pointer = useRef({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);

  return (
    <div
      className={className}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        pointer.current = {
          x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
          y: ((event.clientY - rect.top) / rect.height - 0.5) * 2,
        };
      }}
      onPointerLeave={() => {
        pointer.current = { x: 0, y: 0 };
      }}
    >
      <Canvas
        aria-hidden="true"
        camera={{ position: [0, 1.1, 5.4], fov: 32 }}
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ opacity: ready ? 1 : 0, transition: "opacity 900ms cubic-bezier(0.16,1,0.3,1)" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          setReady(true);
        }}
      >
        <color attach="background" args={["#0b0a09"]} />
        <fog attach="fog" args={["#0b0a09", 7, 14]} />

        <ambientLight intensity={0.35} />
        <directionalLight position={[4, 6, 3]} intensity={1.5} color="#fff2dd" />
        <directionalLight position={[-5, 2, -3]} intensity={0.5} color="#9fb0c6" />

        {/* Locally rendered environment — no HDR is downloaded. */}
        <Environment resolution={192} frames={1}>
          <Lightformer
            intensity={2.6}
            color="#fff4e2"
            position={[0, 4, -3]}
            scale={[9, 3, 1]}
          />
          <Lightformer
            intensity={1.1}
            color="#cf9d5f"
            position={[-4, 1, 2]}
            scale={[3, 4, 1]}
          />
          <Lightformer
            intensity={0.7}
            color="#8b8177"
            position={[4, -1, 2]}
            scale={[4, 3, 1]}
          />
        </Environment>

        <Rig progress={progress} pointer={pointer} textureUrl={textureUrl} />
      </Canvas>
    </div>
  );
}
