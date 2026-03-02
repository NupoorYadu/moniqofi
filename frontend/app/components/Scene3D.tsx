"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Torus, Icosahedron } from "@react-three/drei";
import * as THREE from "three";

function FloatingMesh({ position, color, speed = 1, distort = 0.3, size = 1 }: any) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = state.clock.elapsedTime * 0.2 * speed;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.15 * speed;
    meshRef.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 0.5 * speed) * 0.3;
  });

  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position}>
        <icosahedronGeometry args={[size, 1]} />
        <MeshDistortMaterial
          color={color}
          transparent
          opacity={0.15}
          distort={distort}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

function FloatingRing({ position, color, speed = 1 }: any) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = state.clock.elapsedTime * 0.3 * speed;
    meshRef.current.rotation.z = state.clock.elapsedTime * 0.2 * speed;
  });

  return (
    <Float speed={speed * 0.5} rotationIntensity={0.3} floatIntensity={0.3}>
      <mesh ref={meshRef} position={position}>
        <torusGeometry args={[0.8, 0.15, 16, 32]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.12}
          roughness={0.3}
          metalness={0.9}
        />
      </mesh>
    </Float>
  );
}

function ParticleField() {
  const count = 200;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    ref.current.rotation.x = state.clock.elapsedTime * 0.01;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#E50914"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

export default function Scene3D() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.7 }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 1.5]}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />
        <pointLight position={[-3, 2, 4]} color="#E50914" intensity={0.8} />
        <pointLight position={[3, -2, -4]} color="#831010" intensity={0.5} />

        <FloatingMesh position={[-3, 1.5, -2]} color="#E50914" speed={0.8} distort={0.4} size={1.2} />
        <FloatingMesh position={[3.5, -1, -3]} color="#831010" speed={1.2} distort={0.3} size={0.8} />
        <FloatingMesh position={[-1, -2, -1]} color="#B20710" speed={0.6} distort={0.5} size={0.6} />
        <FloatingMesh position={[2, 2, -4]} color="#666666" speed={1} distort={0.2} size={1} />

        <FloatingRing position={[0, 0, -3]} color="#E50914" speed={0.7} />
        <FloatingRing position={[-2.5, -0.5, -2]} color="#B20710" speed={1.1} />

        <ParticleField />
      </Canvas>
    </div>
  );
}
