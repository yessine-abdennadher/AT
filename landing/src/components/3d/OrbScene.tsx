import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

export const OrbScene: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    // Rotation continue douce plafonnée
    const d = Math.min(delta, 0.05);

    if (meshRef.current) {
      meshRef.current.rotation.y += d * 0.35;
      meshRef.current.rotation.x += d * 0.15;
    }

    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += d * 0.45;
      ring1Ref.current.rotation.y += d * 0.25;
    }

    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= d * 0.5;
      ring2Ref.current.rotation.z += d * 0.3;
    }

    if (ring3Ref.current) {
      ring3Ref.current.rotation.z += d * 0.35;
      ring3Ref.current.rotation.x -= d * 0.2;
    }

    // Réaction fluide au curseur
    if (groupRef.current) {
      const targetX = (state.pointer.x * Math.PI) / 8;
      const targetY = (state.pointer.y * Math.PI) / 8;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -targetY, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Éclairage cyan méditerranéen Tfarhida */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[10, 10, 5]} intensity={1.6} color="#FFFFFF" />
      <pointLight position={[-10, -10, -5]} intensity={1.5} color="#0284C7" />
      <pointLight position={[5, -5, 5]} intensity={0.9} color="#38BDF8" />

      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
        {/* Orbe Tfarhida facetté (Icosaèdre élégant) */}
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[1.5, 2]} />
          <meshStandardMaterial
            color="#0284C7"
            roughness={0.2}
            metalness={0.7}
            wireframe={true}
            emissive="#0369A1"
            emissiveIntensity={0.45}
          />
        </mesh>

        {/* Noyau interne sombre saphir */}
        <mesh>
          <sphereGeometry args={[0.9, 32, 32]} />
          <meshStandardMaterial
            color="#0B1528"
            roughness={0.15}
            metalness={0.9}
          />
        </mesh>

        {/* Anneau orbital 1 (Cyan Céleste Tfarhida #38BDF8) */}
        <mesh ref={ring1Ref}>
          <torusGeometry args={[2.2, 0.025, 16, 100]} />
          <meshStandardMaterial color="#38BDF8" emissive="#0284C7" emissiveIntensity={0.7} />
        </mesh>

        {/* Anneau orbital 2 (Rouge Tunisien #FF4B5C) */}
        <mesh ref={ring2Ref}>
          <torusGeometry args={[2.5, 0.02, 16, 100]} />
          <meshStandardMaterial color="#FF4B5C" emissive="#FF4B5C" emissiveIntensity={0.5} />
        </mesh>

        {/* Anneau orbital 3 (Ambre chaleureux #F59E0B) */}
        <mesh ref={ring3Ref}>
          <torusGeometry args={[2.8, 0.015, 16, 100]} />
          <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.4} />
        </mesh>

        {/* Nœuds satellites flottants */}
        {[
          { pos: [1.8, 1.2, 0.8], col: '#0284C7' },
          { pos: [-1.6, -1.3, 1.0], col: '#FF4B5C' },
          { pos: [0.5, -2.1, -0.6], col: '#10B981' },
          { pos: [-1.8, 1.4, -0.9], col: '#38BDF8' },
        ].map((node, i) => (
          <mesh key={i} position={node.pos as [number, number, number]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color={node.col} emissive={node.col} emissiveIntensity={0.9} />
          </mesh>
        ))}
      </Float>
    </group>
  );
};
