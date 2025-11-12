import { useState, useEffect, useCallback, useRef } from 'react';
import { BattleState, BattleEntity, BattleEvent } from '../types/combat.types';
import { FighterJet, Pilot, Mission } from '../types/game.types';
import { calculateBattleOutcome } from '../utils/combatCalculations';
import * as THREE from 'three';

// Simulation constants
const JET_SPEED = 35;
const TURN_SPEED = 1.8;
const WORLD_RADIUS = 120;
const ROLE_SWAP_BASE_TIME = 10;
const ROLE_SWAP_RANDOMNESS = 2;
const TRACER_SPEED = 150;
const TRACER_LIFESPAN = 2; // seconds
const FIRING_COOLDOWN = 3; // seconds
const BURST_COUNT = 3;
const TRACERS_PER_BURST = 5;
const TIME_BETWEEN_TRACERS = 0.06; // seconds
const TIME_BETWEEN_BURSTS = 0.3; // seconds
const DISENGAGE_ALTITUDE_RANGE = 30;
const GREEN_COHESION_RADIUS = 40;
const GREEN_COHESION_STRENGTH = 0.3;
const GREEN_AVOIDANCE_RADIUS = 15;
const GREEN_AVOIDANCE_STRENGTH = 1.5;
const FIRING_CONE_DOT_PRODUCT = 0.97; // Target must be within this cone to fire
const GREEN_TARGET_SWAP_TIME = 10; // seconds
const MISSILE_SPEED = 100;
const MISSILE_LIFESPAN = 5; // seconds
const LEAD_TARGET_DISTANCE = 10;
const MISSILE_TURN_SPEED = 3.0;
const FLARE_LIFESPAN = 3; // seconds
const FLARE_EJECTION_SPEED = 15; // Relative to the jet
const FLARES_TO_DEPLOY = 6; // 3 pairs
const TIME_BETWEEN_FLARE_PAIRS = 0.2; // 200ms
const FLARE_DRAG = 0.5;
const FLARE_WING_OFFSET = 3;
const WEAPON_RANGE_THRESHOLD = 60;

export const useBattleSimulation = (
  squadron: FighterJet[],
  pilots: Pilot[],
  mission: Mission | null,
  tactic: 'aggressive' | 'defensive'
) => {
  const [battleState, setBattleState] = useState<BattleState | null>(null);

  const initializeBattle = useCallback(() => {
    if (!mission) return;

    // This is the "Director" creating the script. It pre-calculates the entire battle outcome.
    const { events, results } = calculateBattleOutcome(squadron, pilots, mission, tactic);

    // Create battle entities (the "Actors")
    const alliedJets: BattleEntity[] = squadron.map((jet, i) => {
      const pilot = pilots.find((p) => p.id === jet.assignedPilotId);
      const angle = (i / squadron.length) * Math.PI * 2;
      const radius = 40;

      return {
        id: `allied-${i}`,
        originalJetId: jet.id,
        team: 'allied',
        health: 100,
        maxHealth: 100,
        position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
        velocity: [0, 0, 0],
        quaternion: [0, 0, 0, 1],
        targetId: null,
        partnerId: null,
        weaponStrength: jet.computedStats.weaponStrength,
        speed: jet.computedStats.speed,
        agility: jet.computedStats.agility,
        intelligence: pilot?.intelligence || 50,
        endurance: pilot?.endurance || 50,
        isDestroyed: false,
        isWrecked: false,
        destroyedAt: null,
        isEscaping: false,
        killCount: 0,
        aiState: 'attacking',
        roleChangeTimer: 0,
        disengagementAltitude: null,
        fireCooldown: Math.random() * 3,
        burstState: { active: false, burstsLeft: 0, tracersLeftInBurst: 0, nextShotTimer: 0, isKillShot: false },
        flareState: { deploying: false, flaresLeft: 0, nextFlareTimer: 0 },
        wreckageAngularVelocity: null,
        behaviorState: 'idle',
        behaviorTimer: 0,
      };
    });

    const enemyJets: BattleEntity[] = Array.from({ length: mission.enemyCount }, (_, i) => {
      const angle = (i / mission.enemyCount) * Math.PI * 2;
      const radius = 60;
      const isPaired = i % 2 === 0 && i + 1 < mission.enemyCount;
      const partnerIndex = isPaired ? i + 1 : (i % 2 === 1 ? i - 1 : null);
      const aiState = i % 2 === 0 ? 'attacking' : 'following';

      return {
        id: `enemy-${i}`,
        originalJetId: '',
        team: 'enemy',
        health: 100,
        maxHealth: 100,
        position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
        velocity: [0, 0, 0],
        quaternion: [0, 0, 0, 1],
        targetId: null,
        partnerId: partnerIndex !== null ? `enemy-${partnerIndex}` : null,
        weaponStrength: mission.enemyStats.weaponStrength,
        speed: mission.enemyStats.speed,
        agility: mission.enemyStats.agility,
        intelligence: mission.enemyStats.intelligence,
        endurance: mission.enemyStats.endurance,
        isDestroyed: false,
        isWrecked: false,
        destroyedAt: null,
        isEscaping: false,
        killCount: 0,
        aiState: aiState as 'attacking' | 'following',
        roleChangeTimer: aiState === 'attacking' ? ROLE_SWAP_BASE_TIME + (Math.random() - 0.5) * 2 * ROLE_SWAP_RANDOMNESS : 0,
        disengagementAltitude: null,
        fireCooldown: Math.random() * 3,
        burstState: { active: false, burstsLeft: 0, tracersLeftInBurst: 0, nextShotTimer: 0, isKillShot: false },
        flareState: { deploying: false, flaresLeft: 0, nextFlareTimer: 0 },
        wreckageAngularVelocity: null,
        behaviorState: 'idle',
        behaviorTimer: 0,
      };
    });

    setBattleState({
      status: 'active',
      startTime: Date.now(),
      endTime: null,
      alliedJets,
      enemyJets,
      playerTactic: tactic,
      scheduledEvents: events, // The full script for the battle
      executedEvents: [],
      tracers: [],
      missiles: [],
      flares: [],
      results, // The pre-determined final outcome
    });
  }, [squadron, pilots, mission, tactic]);

  // Main simulation loop
  useEffect(() => {
    if (!battleState || battleState.status !== 'active') return;

    const interval = setInterval(() => {
      setBattleState(prevState => {
        if (!prevState || prevState.status !== 'active') {
          clearInterval(interval);
          return prevState;
        }

        const now = Date.now();
        const elapsed = now - prevState.startTime;
        const delta = 0.016; // Fixed timestep for stability

        // --- 1. SCRIPT EXECUTION: Process scheduled events ---
        const eventsToExecute = prevState.scheduledEvents.filter(e => e.timestamp <= elapsed);
        const remainingEvents = prevState.scheduledEvents.filter(e => e.timestamp > elapsed);
        
        let allJets = [...prevState.alliedJets, ...prevState.enemyJets];

        if (eventsToExecute.length > 0) {
            eventsToExecute.forEach(event => {
                if (prevState.executedEvents.some(e => e.timestamp === event.timestamp && e.targetId === event.targetId)) return;

                const targetIndex = allJets.findIndex(j => j.id === event.targetId);
                if (targetIndex !== -1 && !allJets[targetIndex].isWrecked) {
                    if (event.type === 'destroy') {
                        allJets[targetIndex] = {
                            ...allJets[targetIndex],
                            isWrecked: true,
                            destroyedAt: now,
                            wreckageAngularVelocity: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 10],
                        };
                    }
                }
                
                const escaperIndex = allJets.findIndex(j => j.id === event.attackerId);
                if (escaperIndex !== -1 && event.type === 'escape') {
                  allJets[escaperIndex] = { ...allJets[escaperIndex], isEscaping: true };
                }
            });
        }
        
        // --- 2. ACTING: Update jet physics, AI, and visual effects ---
        const tempMatrix = new THREE.Matrix4();
        const targetQuaternion = new THREE.Quaternion();
        const convertToVector3 = (arr: [number, number, number]) => new THREE.Vector3(arr[0], arr[1], arr[2]);
        const convertToQuaternion = (arr: [number, number, number, number]) => new THREE.Quaternion(arr[0], arr[1], arr[2], arr[3]);
        
        const activeAlliedJets = allJets.filter(j => j.team === 'allied' && !j.isDestroyed && !j.isWrecked);
        const alliedBarycenter = new THREE.Vector3();
        if (activeAlliedJets.length > 0) {
          activeAlliedJets.forEach(j => alliedBarycenter.add(convertToVector3(j.position)));
          alliedBarycenter.divideScalar(activeAlliedJets.length);
        }

        let newTracers = [...prevState.tracers];
        let newMissiles = [...prevState.missiles];
        let newFlares = [...prevState.flares];

        const updatedJets = allJets.map(jet => {
            if (jet.isWrecked) {
                // Wreckage physics: falls down with drag
                const velocity = convertToVector3(jet.velocity);
                velocity.multiplyScalar(1 - (delta * 0.9));
                velocity.y -= 9.8 * delta;
                const position = convertToVector3(jet.position).add(velocity.clone().multiplyScalar(delta));

                if (jet.wreckageAngularVelocity) {
                    const angularVel = convertToVector3(jet.wreckageAngularVelocity);
                    const deltaRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(angularVel.x * delta, angularVel.y * delta, angularVel.z * delta));
                    const quaternion = convertToQuaternion(jet.quaternion).multiply(deltaRotation).normalize();
                    jet.quaternion = [quaternion.x, quaternion.y, quaternion.z, quaternion.w];
                }
                
                return { ...jet, position: [position.x, position.y, position.z], velocity: [velocity.x, velocity.y, velocity.z] };
            }

            if (jet.isDestroyed) return jet;

            // AI and Movement
            let target = allJets.find(j => j.id === jet.targetId && !j.isDestroyed && !j.isWrecked);

            // Let upcoming events influence targeting to make the action look intentional
            const nextEventForThisJet = remainingEvents.find(e => e.attackerId === jet.id && e.timestamp < elapsed + 5000);
            if(nextEventForThisJet && nextEventForThisJet.targetId) {
                jet.targetId = nextEventForThisJet.targetId;
                target = allJets.find(j => j.id === jet.targetId && !j.isDestroyed && !j.isWrecked);
            }
            
            // Fallback targeting if no event is imminent
            if (!target) {
              const potentialTargets = allJets.filter(j => j.team !== jet.team && !j.isDestroyed && !j.isWrecked);
              if (potentialTargets.length > 0) {
                target = potentialTargets.reduce((closest, p) => 
                  convertToVector3(jet.position).distanceTo(convertToVector3(p.position)) < convertToVector3(jet.position).distanceTo(convertToVector3(closest.position)) ? p : closest
                );
                jet.targetId = target.id;
              }
            }
            
            let pointToLookAt: THREE.Vector3;
            if (jet.isEscaping) {
                // If escaping, fly away from the center
                pointToLookAt = convertToVector3(jet.position).normalize().multiplyScalar(WORLD_RADIUS * 2);
            } else if (target) {
                pointToLookAt = convertToVector3(target.position);
                // Cohesion and avoidance for allies
                if (jet.team === 'allied' && activeAlliedJets.length > 1) {
                  const distToBarycenter = convertToVector3(jet.position).distanceTo(alliedBarycenter);
                  if (distToBarycenter > GREEN_COHESION_RADIUS) {
                    const pullFactor = Math.min(1, (distToBarycenter - GREEN_COHESION_RADIUS) / GREEN_COHESION_RADIUS);
                    pointToLookAt.lerp(alliedBarycenter, pullFactor * GREEN_COHESION_STRENGTH);
                  }
                  for (const otherJet of activeAlliedJets) {
                    if (jet.id === otherJet.id) continue;
                    const distanceToOther = convertToVector3(jet.position).distanceTo(convertToVector3(otherJet.position));
                    if (distanceToOther < GREEN_AVOIDANCE_RADIUS) {
                      const repulsionVector = new THREE.Vector3().subVectors(convertToVector3(jet.position), convertToVector3(otherJet.position)).normalize();
                      const avoidanceStrength = Math.pow(1 - (distanceToOther / GREEN_AVOIDANCE_RADIUS), 2) * GREEN_AVOIDANCE_STRENGTH;
                      const avoidancePoint = convertToVector3(jet.position).clone().add(repulsionVector.multiplyScalar(WORLD_RADIUS));
                      pointToLookAt.lerp(avoidancePoint, avoidanceStrength);
                    }
                  }
                }
            } else {
                const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(convertToQuaternion(jet.quaternion));
                pointToLookAt = convertToVector3(jet.position).clone().add(forward.multiplyScalar(10));
            }
            
            const position = convertToVector3(jet.position);
            const quaternion = convertToQuaternion(jet.quaternion);
            
            tempMatrix.lookAt(pointToLookAt, position, new THREE.Vector3(0, 1, 0));
            targetQuaternion.setFromRotationMatrix(tempMatrix);
            quaternion.slerp(targetQuaternion, delta * TURN_SPEED);

            const forwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion);
            const velocity = convertToVector3(jet.velocity);
            velocity.lerp(forwardDir.clone().multiplyScalar(JET_SPEED), delta * 2.0);

            position.add(velocity.clone().multiplyScalar(delta));

            if (position.length() > WORLD_RADIUS) { position.negate(); }
            
            // --- VISUAL FIRING LOGIC (No damage is calculated here) ---
            const distanceToTarget = target ? position.distanceTo(convertToVector3(target.position)) : Infinity;
            jet.fireCooldown -= delta;
            if (target && !jet.burstState.active && jet.fireCooldown <= 0) {
                if (distanceToTarget > WEAPON_RANGE_THRESHOLD) { // Fire missile for visual effect
                    const fireDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion);
                    newMissiles.push({ id: `m_${jet.id}_${now}`, position: position.clone(), velocity: velocity.clone().add(fireDirection.multiplyScalar(MISSILE_SPEED)), quaternion, life: MISSILE_LIFESPAN, targetId: jet.targetId, willDetonate: false });
                    jet.fireCooldown = FIRING_COOLDOWN + Math.random();
                } else { // Fire tracers for visual effect
                    jet.burstState = { active: true, burstsLeft: BURST_COUNT, tracersLeftInBurst: TRACERS_PER_BURST, nextShotTimer: 0, isKillShot: false };
                    jet.fireCooldown = FIRING_COOLDOWN + Math.random();
                }
            }
            if (jet.burstState.active) {
                jet.burstState.nextShotTimer -= delta;
                if (jet.burstState.nextShotTimer <= 0) {
                    const fireDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion).add(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.02)).normalize();
                    newTracers.push({ id: `t_${jet.id}_${now}_${Math.random()}`, position: position.clone(), velocity: velocity.clone().add(fireDirection.multiplyScalar(TRACER_SPEED)), quaternion, life: TRACER_LIFESPAN });
                    jet.burstState.tracersLeftInBurst--;
                    if (jet.burstState.tracersLeftInBurst <= 0) {
                        jet.burstState.burstsLeft--;
                        if (jet.burstState.burstsLeft <= 0) jet.burstState.active = false;
                        else {
                            jet.burstState.tracersLeftInBurst = TRACERS_PER_BURST;
                            jet.burstState.nextShotTimer = TIME_BETWEEN_BURSTS;
                        }
                    } else jet.burstState.nextShotTimer = TIME_BETWEEN_TRACERS;
                }
            }
            
            return { ...jet, position: [position.x, position.y, position.z], velocity: [velocity.x, velocity.y, velocity.z], quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w] };
        });

        // Update visual effects lifetimes
        const updatedTracers = newTracers.map(t => ({ ...t, position: t.position.clone().add(t.velocity.clone().multiplyScalar(delta)), life: t.life - delta })).filter(t => t.life > 0);
        const updatedMissiles = newMissiles.map(m => ({ ...m, position: m.position.clone().add(m.velocity.clone().multiplyScalar(delta)), life: m.life - delta })).filter(m => m.life > 0);
        const updatedFlares = newFlares.map(f => ({ ...f, life: f.life - delta })).filter(f => f.life > 0);

        // --- 3. BATTLE END CONDITION ---
        const battleDuration = prevState.results?.duration || 30000;
        if (elapsed >= battleDuration) {
          clearInterval(interval);
          return { ...prevState, status: prevState.results?.victory ? 'victory' : 'defeat', endTime: now };
        }

        // --- 4. RETURN NEW STATE ---
        return {
          ...prevState,
          alliedJets: updatedJets.filter(j => j.team === 'allied'),
          enemyJets: updatedJets.filter(j => j.team === 'enemy'),
          scheduledEvents: remainingEvents,
          executedEvents: [...prevState.executedEvents, ...eventsToExecute.filter(e => !prevState.executedEvents.some(pe => pe.timestamp === e.timestamp && pe.targetId === e.targetId))],
          tracers: updatedTracers,
          missiles: updatedMissiles,
          flares: updatedFlares,
        };
      });
    }, 16); // ~60 FPS

    return () => clearInterval(interval);
  }, [battleState?.status]);

  const forceEndBattle = useCallback(() => {
    setBattleState(prev =>
      prev ? {
        ...prev,
        status: 'victory', // Force a victory for debug purposes
        endTime: Date.now(),
      } : null
    );
  }, []);

  return { battleState, initializeBattle, forceEndBattle };
};
