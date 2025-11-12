
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { BattleEntity, BattleEvent, TracerState, MissileState, FlareState } from '../../types/combat.types';

interface ThreeJsSceneProps {
  alliedJets: BattleEntity[];
  enemyJets: BattleEntity[];
  tracers: TracerState[];
  missiles: MissileState[];
  flares: FlareState[];
  recentEvents?: BattleEvent[];
}

const ThreeJsScene: React.FC<ThreeJsSceneProps> = ({
  alliedJets,
  enemyJets,
  tracers,
  missiles,
  flares,
  recentEvents = [],
}) => {
  const [explosions, setExplosions] = useState<Array<{ id: string; position: [number, number, number]; timestamp: number }>>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  // Create explosions from recent destruction events
  useEffect(() => {
    const newExplosions = recentEvents
      .filter(event => event.type === 'destroy')
      .map(event => {
        const target = [...alliedJets, ...enemyJets].find(j => j.id === event.targetId);
        return target ? {
          id: `explosion-${event.timestamp}-${Math.random()}`,
          position: target.position,
          timestamp: Date.now()
        } : null;
      })
      .filter(Boolean) as Array<{ id: string; position: [number, number, number]; timestamp: number }>;

    if (newExplosions.length > 0) {
      setExplosions(prev => [...prev, ...newExplosions]);
    }
  }, [recentEvents, alliedJets, enemyJets]);

  // Clean up old explosions
  useEffect(() => {
    const interval = setInterval(() => {
      setExplosions(prev => prev.filter(exp => Date.now() - exp.timestamp < 2000));
    }, 100);
    return () => clearInterval(interval);
  }, []);

// Camera Controller Component (must be inside Canvas)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CameraController: React.FC<{ alliedJets: BattleEntity[], controlsRef: React.RefObject<any> }> = ({ alliedJets, controlsRef }) => {
  useFrame(() => {
    if (controlsRef.current) {
      const activeAlliedJets = alliedJets.filter(jet => !jet.isDestroyed && !jet.isWrecked);
      if (activeAlliedJets.length > 0) {
        // Calculate allied barycenter (center of mass)
        const alliedBarycenter = new THREE.Vector3();
        activeAlliedJets.forEach(jet => {
          alliedBarycenter.add(new THREE.Vector3(jet.position[0], jet.position[1], jet.position[2]));
        });
        alliedBarycenter.divideScalar(activeAlliedJets.length);

        // Smooth camera following with lerp
        const CAMERA_TARGET_LERP_SPEED = 1.0;
        controlsRef.current.target.lerp(alliedBarycenter, CAMERA_TARGET_LERP_SPEED * 0.016); // delta time approximation
        controlsRef.current.update();
      }
    }
  });

  return null; // This component doesn't render anything
};

  return (
    <Canvas 
      camera={{ position: [0, 50, 100], fov: 60 }}
      performance={{ min: 0.5 }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Arena Sphere */}
      <ArenaSphere />

      {/* Allied Jets */}
      {alliedJets.map((jet) => (
        <FighterJet key={jet.id} entity={jet} color="green" />
      ))}

      {/* Enemy Jets */}
      {enemyJets.map((jet) => (
        <FighterJet key={jet.id} entity={jet} color="red" />
      ))}

      {/* Tracers */}
      {tracers.map((tracer) => (
        <Tracer key={tracer.id} tracer={tracer} />
      ))}

      {/* Missiles */}
      {missiles.map((missile) => (
        <Missile key={missile.id} missile={missile} />
      ))}

      {/* Flares */}
      {flares.map((flare) => (
        <Flare key={flare.id} flare={flare} />
      ))}

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={50}
        maxDistance={200}
        enableDamping
        dampingFactor={0.05}
      />

      {/* Camera Controller for dynamic following */}
      <CameraController alliedJets={alliedJets} controlsRef={controlsRef} />
    </Canvas>
  );
};

// Arena Sphere Component
const ArenaSphere: React.FC = () => {
  return (
    <mesh>
      <sphereGeometry args={[80, 32, 32]} />
      <meshStandardMaterial
        color="#1a1a2e"
        wireframe
        transparent
        opacity={0.3}
      />
    </mesh>
  );
};

// Advanced Jet Component (adapted from PoC.tsx)
interface FighterJetProps {
  entity: BattleEntity;
  color: 'green' | 'red';
}

const FighterJet: React.FC<FighterJetProps> = ({ entity, color }) => {
  const groupRef = useRef<THREE.Group>(null);
  const trailPoints = useMemo(() => [], []);
  const maxTrailPoints = 50;
  const trailColor = color === 'green' ? '#4ADE80' : '#F87171';
  const trailLine = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({ color: trailColor, transparent: true, opacity: 0.6 });
    return new THREE.Line(geometry, material);
  }, [trailColor]);

  // Wreckage smoke trail
  const smokeTrailPoints = useMemo(() => [], []);
  const maxSmokeTrailPoints = 400;
  const smokeTrailLine = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 1.0, linewidth: 3 });
    return new THREE.Line(geometry, material);
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      const position = new THREE.Vector3(entity.position[0], entity.position[1], entity.position[2]);
      const quaternion = new THREE.Quaternion(entity.quaternion[0], entity.quaternion[1], entity.quaternion[2], entity.quaternion[3]);

      groupRef.current.position.copy(position);
      groupRef.current.quaternion.copy(quaternion);

      if (entity.isWrecked) {
        // Clear normal trail if it exists
        if (trailPoints.length > 0) {
          trailPoints.length = 0;
          trailLine.geometry.dispose();
          trailLine.geometry = new THREE.BufferGeometry();
        }

        // Update smoke trail
        smokeTrailPoints.push(position);
        if (smokeTrailPoints.length > maxSmokeTrailPoints) smokeTrailPoints.shift();

        if (smokeTrailPoints.length > 1) {
          smokeTrailLine.geometry.dispose();
          smokeTrailLine.geometry = new THREE.BufferGeometry().setFromPoints(smokeTrailPoints);
          const colors = [];
          const yellow = new THREE.Color(0xffff99); // Fiery core
          const orange = new THREE.Color(0xffa500); // Orange fire
          const darkGray = new THREE.Color(0x222222); // Black smoke
          for (let i = 0; i < smokeTrailPoints.length; i++) {
            const t = i / (smokeTrailPoints.length - 1);
            const color = new THREE.Color();
            if (t > 0.8) { // Last 20% of the trail (closest to jet) is fiery yellow
              color.lerpColors(orange, yellow, (t - 0.8) / 0.2);
            } else { // First 80% is a gradient from dark gray to orange
              color.lerpColors(darkGray, orange, t / 0.8);
            }
            colors.push(color.r, color.g, color.b);
          }
          smokeTrailLine.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        }
      } else {
        groupRef.current.visible = true;
        // Clear smoke trail if it exists
        if (smokeTrailPoints.length > 0) {
          smokeTrailPoints.length = 0;
          smokeTrailLine.geometry.dispose();
          smokeTrailLine.geometry = new THREE.BufferGeometry();
        }

        // Update normal trail
        if (trailPoints.length > 0) {
          const lastPoint = trailPoints[trailPoints.length - 1];
          const teleportThreshold = 120; // WORLD_RADIUS
          if (position.distanceTo(lastPoint) > teleportThreshold) {
            trailPoints.length = 0;
          }
        }
        trailPoints.push(position);
        if (trailPoints.length > maxTrailPoints) trailPoints.shift();

        trailLine.geometry.dispose();
        if (trailPoints.length > 1) {
          trailLine.geometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
        } else {
          trailLine.geometry = new THREE.BufferGeometry();
        }
      }
    }
  });

  if (entity.isDestroyed) return null;

  const baseColor = color === 'green' ? '#2E8B57' : '#C41E3A';

  return (
    <group>
      <group ref={groupRef} scale={0.5}>
        <mesh position={[0, 0, 0]}><boxGeometry args={[1, 0.8, 5]} /><meshStandardMaterial color={baseColor} /></mesh>
        <mesh position={[0, 0, -0.5]}><boxGeometry args={[7, 0.2, 1.5]} /><meshStandardMaterial color={baseColor} /></mesh>
        <mesh position={[0, 0.65, 1.5]}><boxGeometry args={[0.8, 0.5, 1]} /><meshStandardMaterial color={'#9999ff'} /></mesh>
        <mesh position={[0, 1, -2]}><boxGeometry args={[0.2, 1.2, 0.8]} /><meshStandardMaterial color={baseColor} /></mesh>
        <mesh position={[0, 0, -2]}><boxGeometry args={[2.5, 0.1, 0.8]} /><meshStandardMaterial color={baseColor} /></mesh>
        {entity.isWrecked && (
          <mesh scale={[0.5, 0.5, 1.5]}>
            <sphereGeometry args={[1, 32, 16]} />
            <meshStandardMaterial
              color="orange"
              emissive="orange"
              emissiveIntensity={1}
              transparent
              opacity={0.6}
              toneMapped={false}
            />
          </mesh>
        )}
      </group>
      {entity.isWrecked ? <primitive object={smokeTrailLine} /> : <primitive object={trailLine} />}
    </group>
  );
};

// Projectile Component with Smoke Trail - REMOVED for performance
// The blue projectiles were causing FPS drops and are now replaced by the PoC firing system

// Tracer Component (from PoC.tsx)
interface TracerProps {
  tracer: TracerState;
}

const Tracer: React.FC<TracerProps> = ({ tracer }) => {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.position.copy(tracer.position);
      ref.current.quaternion.copy(tracer.quaternion);
    }
  });

  return (
    <mesh ref={ref}>
      <capsuleGeometry args={[0.1, 1.5, 4, 8]} />
      <meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={2} toneMapped={false} />
    </mesh>
  );
};

// Missile Component (from PoC.tsx)
interface MissileProps {
  missile: MissileState;
}

const Missile: React.FC<MissileProps> = ({ missile }) => {
  const ref = useRef<THREE.Mesh>(null);
  const trailPoints = useMemo(() => [], []);
  const maxTrailPoints = 30;

  const trailLine = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({ color: '#CCCCCC', transparent: true, opacity: 0.5 });
    return new THREE.Line(geometry, material);
  }, []);

  useFrame(() => {
    if (ref.current) {
      ref.current.position.copy(missile.position);
      ref.current.quaternion.copy(missile.quaternion);

      trailPoints.push(ref.current.position.clone());
      if (trailPoints.length > maxTrailPoints) {
        trailPoints.shift();
      }

      if (trailPoints.length > 1) {
        trailLine.geometry.dispose();
        trailLine.geometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
      }
    }
  });

  return (
    <group>
      <mesh ref={ref}>
        <cylinderGeometry args={[0.2, 0.2, 3, 8]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1} toneMapped={false} />
      </mesh>
      <primitive object={trailLine} />
    </group>
  );
};

// Flare Component (from PoC.tsx)
interface FlareProps {
  flare: FlareState;
}

const Flare: React.FC<FlareProps> = ({ flare }) => {
  const ref = useRef<THREE.Mesh>(null);
  const trailPoints = useMemo(() => [], []);
  const maxTrailPoints = 20;

  const trailLine = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.8, vertexColors: true });
    return new THREE.Line(geometry, material);
  }, []);

  useFrame(() => {
    if (ref.current) {
      ref.current.position.copy(flare.position);
      trailPoints.push(ref.current.position.clone());
      if (trailPoints.length > maxTrailPoints) {
        trailPoints.shift();
      }

      if (trailPoints.length > 1) {
        trailLine.geometry.dispose();
        trailLine.geometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
        const colors = [];
        const white = new THREE.Color(0xffffff);
        const gray = new THREE.Color(0x888888);
        for (let i = 0; i < trailPoints.length; i++) {
          const t = i / (trailPoints.length - 1);
          const color = new THREE.Color().lerpColors(gray, white, t);
          colors.push(color.r, color.g, color.b);
        }
        trailLine.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      }
    }
  });

  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={4} toneMapped={false} />
      </mesh>
      <primitive object={trailLine} />
    </group>
  );
};

export default ThreeJsScene;
