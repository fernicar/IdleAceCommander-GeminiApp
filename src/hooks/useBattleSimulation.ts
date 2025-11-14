import { useState, useEffect, useCallback } from 'react';
import { BattleState, BattleEntity, BattleEvent } from '../types/combat.types';
import { FighterJet, Pilot, Mission, PreCalculatedOutcome } from '../types/game.types';
import { calculateBattleOutcome } from '../utils/combatCalculations';
import * as THREE from 'three';

// Simulation constants (adapted from PoC.tsx)
const RESPAWN_TIME = 500005000; // ms
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
const MISSILE_PROXIMITY_DETONATION_RANGE = 10;
const LEAD_TARGET_DISTANCE = 10;
const MISSILE_TURN_SPEED = 3.0;
const FLARE_LIFESPAN = 3; // seconds
const FLARE_EJECTION_SPEED = 15; // Relative to the jet
const FLARES_TO_DEPLOY = 6; // 3 pairs
const TIME_BETWEEN_FLARE_PAIRS = 0.2; // 200ms
const FLARE_DRAG = 0.5;
const FLARE_WING_OFFSET = 3;
const WEAPON_RANGE_THRESHOLD = 60;
const BATTLE_DURATION = 30000; // Max duration for active combat
const DISENGAGE_DELAY = 2000; // Time after last kill or before timeout to start disengaging
const DISENGAGE_DURATION = 5000; // 5 seconds for jets to fly off-screen

export const useBattleSimulation = (
  squadron: FighterJet[],
  pilots: Pilot[],
  mission: Mission | null,
  tactic: 'aggressive' | 'defensive',
  debugMode: boolean,
  respawnEnabled: boolean,
  preCalculatedOutcome: PreCalculatedOutcome | null
) => {
  const [battleState, setBattleState] = useState<BattleState | null>(null);

  const initializeBattle = useCallback(() => {
    if (!mission) return;

    // This is the "Director" creating the script. It pre-calculates the entire battle outcome.
    const { events, results } = preCalculatedOutcome
      ? preCalculatedOutcome
      : calculateBattleOutcome(squadron, pilots, mission, tactic);
      
    const lastDestroyEvent = [...events].filter(e => e.type === 'destroy').sort((a, b) => b.timestamp - a.timestamp)[0];
    
    // The time when disengagement should start if the battle times out.
    // This is 2 seconds before the max combat duration.
    const timeoutTriggeredDisengageTime = BATTLE_DURATION - DISENGAGE_DELAY;

    // The time when disengagement should start after the last kill.
    const lastKillTime = lastDestroyEvent ? lastDestroyEvent.timestamp : Infinity;
    const killTriggeredDisengageTime = lastKillTime + DISENGAGE_DELAY;

    // Disengagement starts at whichever of these events happens first.
    const disengageTime = Math.min(killTriggeredDisengageTime, timeoutTriggeredDisengageTime);
    const battleEndTime = disengageTime + DISENGAGE_DURATION;

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
        cinematicKillTargetId: null,
        isTargetOfCinematicKill: false,
      };
    });

    const enemyJets: BattleEntity[] = [];
    const numEnemies = mission.enemyCount;

    if (numEnemies > 0) {
        // Determine number of attackers (squad leaders) based on total enemy count
        const numAttackers = numEnemies <= 2 ? numEnemies : Math.floor((numEnemies - 1) / 4) + 1;
        const leaders: BattleEntity[] = [];

        // Create all jet entities first
        for (let i = 0; i < numEnemies; i++) {
            const angle = (i / numEnemies) * Math.PI * 2;
            const radius = 60;
            enemyJets.push({
                id: `enemy-${i}`,
                originalJetId: '',
                team: 'enemy',
                health: 100,
                maxHealth: 100,
                position: [Math.cos(angle) * radius, (Math.random() - 0.5) * 10, Math.sin(angle) * radius],
                velocity: [0, 0, 0],
                quaternion: [0, 0, 0, 1],
                targetId: null,
                partnerId: null, // Will be assigned leader ID for wingmen
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
                aiState: 'following', // Default to wingman
                roleChangeTimer: 0, // No role swapping on timer anymore
                disengagementAltitude: null,
                fireCooldown: Math.random() * 3,
                burstState: { active: false, burstsLeft: 0, tracersLeftInBurst: 0, nextShotTimer: 0, isKillShot: false },
                flareState: { deploying: false, flaresLeft: 0, nextFlareTimer: 0 },
                wreckageAngularVelocity: null,
                behaviorState: 'idle',
                behaviorTimer: 0,
                cinematicKillTargetId: null,
                isTargetOfCinematicKill: false,
            });
        }

        // Assign roles and leaders
        const wingmen: BattleEntity[] = [];
        for (let i = 0; i < numEnemies; i++) {
            if (i < numAttackers) {
                enemyJets[i].aiState = 'attacking';
                leaders.push(enemyJets[i]);
            } else {
                wingmen.push(enemyJets[i]);
            }
        }
        
        // Assign wingmen to leaders
        if (leaders.length > 0) {
            wingmen.forEach((wingman, index) => {
                const leaderIndex = index % leaders.length;
                wingman.partnerId = leaders[leaderIndex].id;
            });
        }
    }


        setBattleState({
          status: 'active',
          startTime: Date.now(),
          endTime: null,
          disengageTime,
          battleEndTime,
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
  }, [squadron, pilots, mission, tactic, preCalculatedOutcome]);

  // Main simulation loop
  useEffect(() => {
    if (!battleState || battleState.status === 'victory' || battleState.status === 'defeat') return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - battleState.startTime;
      
      // Check for state transitions
      if (battleState.status === 'active' && elapsed > battleState.disengageTime) {
        setBattleState(prev => (prev ? { ...prev, status: 'disengaging' } : null));
      }
      
      if (elapsed >= battleState.battleEndTime) {
        setBattleState(prev =>
          prev
            ? {
                ...prev,
                status: prev.results?.victory ? 'victory' : 'defeat',
                endTime: Date.now(),
              }
            : null
        );
        return;
      }


      // Realistic AI physics and movement (adapted from PoC.tsx)
      // Frame rate limiting to prevent physics instability
      let delta = 0.016; // ~60 FPS
      if (delta > 0.1) delta = 0.1; // Frame rate limiter
      const tempMatrix = new THREE.Matrix4();
      const targetQuaternion = new THREE.Quaternion();

      // Convert arrays to THREE objects for calculations
      const convertToVector3 = (arr: [number, number, number]) => new THREE.Vector3(arr[0], arr[1], arr[2]);
      const convertToQuaternion = (arr: [number, number, number, number]) => new THREE.Quaternion(arr[0], arr[1], arr[2], arr[3]);
      const convertFromVector3 = (v: THREE.Vector3): [number, number, number] => [v.x, v.y, v.z];
      const convertFromQuaternion = (q: THREE.Quaternion): [number, number, number, number] => [q.x, q.y, q.z, q.w];

      const allJets = [...battleState.alliedJets, ...battleState.enemyJets];
      const activeAlliedJets = battleState.alliedJets.filter(j => j.team === 'allied' && !j.isDestroyed && !j.isWrecked);
      const activeEnemyJets = battleState.enemyJets.filter(j => j.team === 'enemy' && !j.isDestroyed && !j.isWrecked);

      // Initialize combat effect arrays
      const newTracers = [...battleState.tracers];
      let newMissiles = [...battleState.missiles];
      const newFlares = [...battleState.flares];

      // Execute scheduled events
      const newExecutedEvents: BattleEvent[] = [];

      battleState.scheduledEvents.forEach((event) => {
        if (event.timestamp <= elapsed && !battleState.executedEvents.includes(event)) {
          newExecutedEvents.push(event);

          // Mark entities as destroyed
          if (event.type === 'destroy') {
            const attacker = allJets.find(j => j.id === event.attackerId && !j.isWrecked);
            const target = allJets.find(j => j.id === event.targetId && !j.isWrecked);

            if (attacker && target) {
                const attackerPos = convertToVector3(attacker.position);
                const attackerQuat = convertToQuaternion(attacker.quaternion);
                const fireDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(attackerQuat);
                const missileVelocity = fireDirection.multiplyScalar(MISSILE_SPEED);
                const finalVelocity = convertToVector3(attacker.velocity).clone().add(missileVelocity);
                const missileQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), finalVelocity.clone().normalize());

                newMissiles.push({
                  id: `m_forced_${attacker.id}_${Date.now()}`,
                  position: attackerPos.clone(),
                  velocity: finalVelocity,
                  quaternion: missileQuaternion,
                  life: MISSILE_LIFESPAN,
                  targetId: target.id,
                  willDetonate: true,
                });
            }
          }
        }
      });


      // --- Missile Detonation & Wreckage Creation ---
      const destroyedJetIds = new Set<string>();
      newMissiles = newMissiles.filter(missile => {
        const targetJet = allJets.find(j => j.id === missile.targetId && !j.isWrecked && !j.isDestroyed);
        if (targetJet && missile.position.distanceTo(convertToVector3(targetJet.position)) < MISSILE_PROXIMITY_DETONATION_RANGE) {
          if (missile.willDetonate) {
            if (!destroyedJetIds.has(targetJet.id)) {
              destroyedJetIds.add(targetJet.id);
            }
            return false; // Missile is consumed
          } else {
            missile.targetId = null; // Dud missile, continues on its path
          }
        }
        return true;
      });

      // Apply missile damage to jets
      if (destroyedJetIds.size > 0) {
        allJets.forEach(jet => {
          if (destroyedJetIds.has(jet.id)) {
            jet.isWrecked = true;
            jet.destroyedAt = Date.now();
            // Add explosion impulse
            const velocity = convertToVector3(jet.velocity);
            velocity.add(new THREE.Vector3((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20));
            jet.velocity = convertFromVector3(velocity);
            // Add initial angular velocity for spinning
            jet.wreckageAngularVelocity = [
              (Math.random() - 0.5) * 10, // roll
              (Math.random() - 0.5) * 5,  // pitch
              (Math.random() - 0.5) * 10  // yaw
            ];

            // --- HANDLE LEADER PROMOTION ON DEATH ---
            if (jet.team === 'enemy' && jet.aiState === 'attacking') {
              const wingmenOfFallenLeader = allJets.filter(w => w.partnerId === jet.id && !w.isDestroyed && !w.isWrecked && !destroyedJetIds.has(w.id));

              if (wingmenOfFallenLeader.length > 0) {
                const newLeader = wingmenOfFallenLeader[0];
                
                // Promote wingman to leader
                newLeader.aiState = 'attacking';
                newLeader.partnerId = null;
                newLeader.disengagementAltitude = null;
                
                // The new leader needs a target from the currently active allies
                const currentActiveAllies = allJets.filter(j => j.team === 'allied' && !j.isDestroyed && !j.isWrecked && !destroyedJetIds.has(j.id));
                if (currentActiveAllies.length > 0) {
                    newLeader.targetId = currentActiveAllies[Math.floor(Math.random() * currentActiveAllies.length)].id;
                }

                // Reassign the rest of the squad to the new leader
                const remainingWingmen = wingmenOfFallenLeader.slice(1);
                remainingWingmen.forEach(wingman => {
                  wingman.partnerId = newLeader.id;
                });
              }
            }
          }
        });
      }

      const alliedBarycenter = new THREE.Vector3();
      if (activeAlliedJets.length > 0) {
        activeAlliedJets.forEach(j => alliedBarycenter.add(convertToVector3(j.position)));
        alliedBarycenter.divideScalar(activeAlliedJets.length);
      }

      // --- Green Team Target Swapping ---
      const greenTargetSwapTimer = Math.floor(Date.now() / 1000) % GREEN_TARGET_SWAP_TIME;
      if (greenTargetSwapTimer === 0) {
        const greenJetsToSwap = allJets.filter(j => j.team === 'allied' && !j.isDestroyed && !j.isWrecked);
        if (greenJetsToSwap.length >= 2) {
          const tempTargetId = greenJetsToSwap[0].targetId;
          greenJetsToSwap[0].targetId = greenJetsToSwap[1].targetId;
          greenJetsToSwap[1].targetId = tempTargetId;
        }
      }

      // --- Cinematic Kill Preparation ---
      const CINEMATIC_WINDOW = 3000; // 3 seconds

      // Reset cinematic states from previous frame
      allJets.forEach(jet => {
        jet.cinematicKillTargetId = null;
        jet.isTargetOfCinematicKill = false;
      });

      // Set cinematic states for jets with upcoming scripted kills
      allJets.forEach(jet => {
        const upcomingEvent = battleState.scheduledEvents.find(e =>
          e.attackerId === jet.id &&
          e.type === 'destroy' &&
          e.timestamp > elapsed &&
          e.timestamp <= elapsed + CINEMATIC_WINDOW &&
          !battleState.executedEvents.includes(e)
        );

        if (upcomingEvent) {
          jet.cinematicKillTargetId = upcomingEvent.targetId;
          const targetJet = allJets.find(j => j.id === upcomingEvent.targetId);
          if (targetJet) {
            targetJet.isTargetOfCinematicKill = true;
          }
        }
      });

      // Update each jet with AI physics
      const updateJet = (jet: BattleEntity): BattleEntity => {
        if (jet.isWrecked) {
          // Wreckage physics: falls down with drag
          const velocity = convertToVector3(jet.velocity);
          velocity.multiplyScalar(1 - (delta * 0.9)); // Air resistance / drag
          velocity.y -= 9.8 * delta; // Gravity

          const position = convertToVector3(jet.position);
          position.add(velocity.clone().multiplyScalar(delta));

          // Angular velocity for spinning
          if (jet.wreckageAngularVelocity) {
            const angularVel = new THREE.Vector3(...jet.wreckageAngularVelocity);
            const deltaRotation = new THREE.Quaternion().setFromEuler(
              new THREE.Euler(
                angularVel.x * delta,
                angularVel.y * delta,
                angularVel.z * delta
              )
            );
            const quaternion = convertToQuaternion(jet.quaternion);
            // FIX: Assign multiplication result back to quaternion
            quaternion.multiply(deltaRotation).normalize();
            jet.quaternion = convertFromQuaternion(quaternion);
          }

          // World boundaries for wreckage
          if (position.length() > WORLD_RADIUS) {
            jet.destroyedAt = Date.now() - RESPAWN_TIME - 1; // Mark for cleanup
          }

          return {
            ...jet,
            position: convertFromVector3(position),
            velocity: convertFromVector3(velocity),
          };
        }

        if (jet.isDestroyed) return jet;

        // AI and Movement
        let pointToLookAt: THREE.Vector3;

        // Highest priority: Disengagement at the end of the battle
        if (battleState.status === 'disengaging') {
          const exitY = jet.position[1];
          const exitZ = jet.position[2] * 0.5; // Converge slightly towards the center z-axis
          if (jet.team === 'allied') {
            pointToLookAt = new THREE.Vector3(-WORLD_RADIUS * 3, exitY, exitZ);
          } else { // 'enemy'
            pointToLookAt = new THREE.Vector3(WORLD_RADIUS * 3, exitY, exitZ);
          }
        } else if (jet.cinematicKillTargetId) {
            // --- ATTACKER CINEMATIC MOVEMENT ---
            const cinematicTarget = allJets.find(j => j.id === jet.cinematicKillTargetId);
            if (cinematicTarget) {
                const targetPos = convertToVector3(cinematicTarget.position);
                const targetQuat = convertToQuaternion(cinematicTarget.quaternion);
                const targetBackward = new THREE.Vector3(0, 0, -1).applyQuaternion(targetQuat);
                
                const tailingDistance = WEAPON_RANGE_THRESHOLD * 0.5;
                pointToLookAt = targetPos.clone().add(targetBackward.multiplyScalar(tailingDistance));
            } else {
                pointToLookAt = convertToVector3(jet.position).clone().add(new THREE.Vector3(0, 0, 1).applyQuaternion(convertToQuaternion(jet.quaternion)));
            }
        } else if (jet.isEscaping) {
            pointToLookAt = convertToVector3(jet.position).normalize().multiplyScalar(WORLD_RADIUS * 2);
        } else {
          // --- REGULAR COMBAT AI ---
          let target = allJets.find(j => j.id === jet.targetId && !j.isDestroyed && !j.isWrecked);

          const imminentEventWindow = 5000; // Look ahead 5 seconds for a scripted event.
          const upcomingEvent = battleState.scheduledEvents.find(e => 
              e.attackerId === jet.id &&
              e.type === 'destroy' &&
              e.timestamp > elapsed &&
              e.timestamp <= elapsed + imminentEventWindow
          );
  
          if (upcomingEvent && (jet.aiState === 'attacking' || jet.team === 'allied')) {
              jet.targetId = upcomingEvent.targetId;
              target = allJets.find(j => j.id === jet.targetId && !j.isDestroyed && !j.isWrecked);
          }
  
  
          // AI target selection logic
          if (jet.team === 'allied') {
            if (!target) {
              // Find closest enemy
              const enemies = allJets.filter(j => j.team === 'enemy' && !j.isDestroyed && !j.isWrecked);
              if (enemies.length > 0) {
                target = enemies.reduce((closest, enemy) => {
                  const distToClosest = convertToVector3(jet.position).distanceTo(convertToVector3(closest.position));
                  const distToEnemy = convertToVector3(jet.position).distanceTo(convertToVector3(enemy.position));
                  return distToEnemy < distToClosest ? enemy : closest;
                });
                jet.targetId = target.id;
              }
            }
          } else if (jet.team === 'enemy') {
            // Enemy AI - attack allied jets
            if (jet.aiState === 'attacking' && !target) {
              const allies = allJets.filter(j => j.team === 'allied' && !j.isDestroyed && !j.isWrecked);
              if (allies.length > 0) {
                target = allies[Math.floor(Math.random() * allies.length)];
                jet.targetId = target.id;
              }
            } else if (jet.aiState === 'following') {
                target = allJets.find(j => j.id === jet.partnerId); // Target is the leader
            }
          }

          if (target) {
            if (jet.team === 'enemy' && jet.aiState === 'following') {
              const leader = allJets.find(j => j.id === jet.partnerId);
              if (leader) {
                const leaderForward = new THREE.Vector3(0, 0, 1).applyQuaternion(convertToQuaternion(leader.quaternion));
                pointToLookAt = convertToVector3(leader.position).clone().sub(leaderForward.multiplyScalar(15));
                if (jet.disengagementAltitude !== null) {
                  pointToLookAt.y = jet.disengagementAltitude;
                }
              } else {
                // Leader is dead, act independently until promoted or battle ends
                pointToLookAt = convertToVector3(jet.position).clone().add(new THREE.Vector3(0, 0, 1).applyQuaternion(convertToQuaternion(jet.quaternion)));
              }
            } else {
              pointToLookAt = convertToVector3(target.position);
            }

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
        }


        // Calculate rotation to target
        const position = convertToVector3(jet.position);
        const quaternion = convertToQuaternion(jet.quaternion);

        if (battleState.status === 'disengaging') {
          // During disengagement, force a level flight attitude by fixing the 'up' vector.
          tempMatrix.lookAt(pointToLookAt, position, new THREE.Vector3(0, 1, 0));
        } else {
          // Normal combat rotation that allows rolling.
          const directionToTarget = pointToLookAt.clone().sub(position).normalize();
          const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion);
  
          const rotationAxis = forward.clone().cross(directionToTarget).normalize();
  
          if (rotationAxis.lengthSq() > 0.001) {
            const targetUp = directionToTarget.clone().cross(rotationAxis).normalize().negate();
            tempMatrix.lookAt(pointToLookAt, position, targetUp);
          } else {
            // Already facing target, maintain up vector
            tempMatrix.lookAt(pointToLookAt, position, new THREE.Vector3(0, 1, 0));
          }
        }

        targetQuaternion.setFromRotationMatrix(tempMatrix);
        
        let turnRate = TURN_SPEED;
        
        // If the jet is the victim of a cinematic kill, reduce its turn rate to simulate G-LOC.
        if (jet.isTargetOfCinematicKill) {
          turnRate = TURN_SPEED * 0.3;
        } 
        // Else if the jet is an attacker, check if we need to boost turn rate for a "hard steer".
        else if (jet.cinematicKillTargetId) {
            const upcomingEvent = battleState.scheduledEvents.find(e =>
                e.attackerId === jet.id &&
                e.targetId === jet.cinematicKillTargetId &&
                e.type === 'destroy' &&
                e.timestamp > elapsed
            );

            // Boost turn rate in the final second before the scripted missile launch.
            if (upcomingEvent && (upcomingEvent.timestamp - elapsed <= 1000)) {
                turnRate = TURN_SPEED * 3.0;
            }
        }
        
        quaternion.slerp(targetQuaternion, delta * turnRate);

        // Update velocity and position
        const forwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion);
        const velocity = convertToVector3(jet.velocity);
        velocity.lerp(forwardDir.clone().multiplyScalar(JET_SPEED), delta * 2.0);

        position.add(velocity.clone().multiplyScalar(delta));

        // World boundaries
        if (position.length() > WORLD_RADIUS) {
          position.negate();
        }

        // --- FIRING LOGIC ---
        const target = allJets.find(j => j.id === jet.targetId && !j.isDestroyed && !j.isWrecked);
        if (battleState.status === 'active' && jet.aiState === 'attacking' && target && (jet.team === 'allied'|| jet.team === 'enemy')) {
          const forwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion);
          const dirToTarget = convertToVector3(target.position).clone().sub(position).normalize();
          const dotProduct = forwardDir.dot(dirToTarget);
          const isTargetInFront = dotProduct > FIRING_CONE_DOT_PRODUCT;
          const distanceToTarget = position.distanceTo(convertToVector3(target.position));

          jet.fireCooldown -= delta;
          if (jet.fireCooldown <= 0 && !jet.burstState.active && isTargetInFront) {

            if (distanceToTarget > WEAPON_RANGE_THRESHOLD) {
              // Long range: Fire missile
              const fireDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion);
              const missileVelocity = fireDirection.multiplyScalar(MISSILE_SPEED);
              const finalVelocity = convertToVector3(jet.velocity).clone().add(missileVelocity);
              const missileQuaternion = new THREE.Quaternion();
              missileQuaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), finalVelocity.clone().normalize());
              
              const scriptedKillEvent = battleState.scheduledEvents.find(e =>
                e.type === 'destroy' &&
                e.attackerId === jet.id &&
                e.targetId === jet.targetId &&
                !battleState.executedEvents.includes(e) &&
                !newExecutedEvents.includes(e)
              );

              if (scriptedKillEvent) {
                newExecutedEvents.push(scriptedKillEvent);
              }

              newMissiles.push({
                id: `m_${jet.id}_${Date.now()}`,
                position: position.clone(),
                velocity: finalVelocity,
                quaternion: missileQuaternion,
                life: MISSILE_LIFESPAN,
                targetId: jet.targetId,
                willDetonate: !!scriptedKillEvent,
              });

              // Trigger flares on target
              const targetJet = allJets.find(j => j.id === jet.targetId && !j.isDestroyed && !j.isWrecked);
              if (targetJet && !targetJet.flareState.deploying) {
                targetJet.flareState.deploying = true;
                targetJet.flareState.flaresLeft = FLARES_TO_DEPLOY;
                targetJet.flareState.nextFlareTimer = 0;
              }

              jet.fireCooldown = FIRING_COOLDOWN + (Math.random() - 0.5);
            } else {
              // Close range: Fire tracers
              jet.burstState.active = true;
              jet.burstState.burstsLeft = BURST_COUNT;
              jet.burstState.tracersLeftInBurst = TRACERS_PER_BURST;
              jet.burstState.nextShotTimer = 0;
              jet.fireCooldown = FIRING_COOLDOWN + (Math.random() - 0.5);
            }
          }
        }

        // --- BURST FIRING ---
        if (battleState.status === 'active' && jet.burstState.active && target) {
          jet.burstState.nextShotTimer -= delta;
          if (jet.burstState.nextShotTimer <= 0) {
            const fireDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion);
            fireDirection.add(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.02)).normalize();

            const tracerVelocity = convertToVector3(jet.velocity).clone().add(fireDirection.multiplyScalar(TRACER_SPEED));
            const tracerQuaternion = new THREE.Quaternion();
            tracerQuaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tracerVelocity.clone().normalize());

            newTracers.push({
              id: `t_${jet.id}_${Date.now()}_${Math.random()}`,
              position: position.clone(),
              velocity: tracerVelocity,
              quaternion: tracerQuaternion,
              life: TRACER_LIFESPAN
            });

            // Kill shot logic
            if (jet.burstState.isKillShot) {
              const targetJet = allJets.find(j => j.id === jet.targetId && !j.isDestroyed && !j.isWrecked);
              if (targetJet) {
                targetJet.isWrecked = true;
                targetJet.destroyedAt = Date.now();
                targetJet.wreckageAngularVelocity = [
                  (Math.random() - 0.5) * 10,
                  (Math.random() - 0.5) * 5,
                  (Math.random() - 0.5) * 10
                ];
              }
              jet.burstState.active = false;
              jet.burstState.isKillShot = false;
            }

            if (jet.burstState.active) {
              jet.burstState.tracersLeftInBurst--;
              if (jet.burstState.tracersLeftInBurst <= 0) {
                jet.burstState.burstsLeft--;
                if (jet.burstState.burstsLeft <= 0) {
                  jet.burstState.active = false;
                  jet.burstState.isKillShot = false;
                } else {
                  jet.burstState.tracersLeftInBurst = TRACERS_PER_BURST;
                  jet.burstState.nextShotTimer = TIME_BETWEEN_BURSTS;
                  
                  if (jet.burstState.burstsLeft === 1) {
                     const scriptedKillEvent = battleState.scheduledEvents.find(e =>
                        e.type === 'destroy' &&
                        e.attackerId === jet.id &&
                        e.targetId === jet.targetId &&
                        !battleState.executedEvents.includes(e) &&
                        !newExecutedEvents.includes(e)
                    );
                    
                    if (scriptedKillEvent) {
                        newExecutedEvents.push(scriptedKillEvent);
                        jet.burstState.isKillShot = true;
                    } else {
                        jet.burstState.isKillShot = false;
                    }
                  } else {
                    jet.burstState.isKillShot = false;
                  }
                }
              } else {
                jet.burstState.nextShotTimer = TIME_BETWEEN_TRACERS;
              }
            }
          }
        }

// --- FLARE DEPLOYMENT ---
        if (jet.flareState.deploying) {
          jet.flareState.nextFlareTimer -= delta;
          if (jet.flareState.nextFlareTimer <= 0 && jet.flareState.flaresLeft > 0) {
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
            const back = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);

            // Left flare
            const leftVel = right.clone().negate().add(back.clone().multiplyScalar(0.5)).normalize().multiplyScalar(FLARE_EJECTION_SPEED);
            const leftPos = position.clone().add(right.clone().negate().multiplyScalar(FLARE_WING_OFFSET));
            newFlares.push({
              id: `f_${jet.id}_${Date.now()}_l`,
              position: leftPos,
              velocity: leftVel,
              life: FLARE_LIFESPAN
            });

            // Right flare
            const rightVel = right.clone().add(back.clone().multiplyScalar(0.5)).normalize().multiplyScalar(FLARE_EJECTION_SPEED);
            const rightPos = position.clone().add(right.clone().multiplyScalar(FLARE_WING_OFFSET));
            newFlares.push({
              id: `f_${jet.id}_${Date.now()}_r`,
              position: rightPos,
              velocity: rightVel,
              life: FLARE_LIFESPAN
            });

            jet.flareState.flaresLeft -= 2;
            if (jet.flareState.flaresLeft <= 0) {
              jet.flareState.deploying = false;
            } else {
              // FIX: Corrected typo from nextShotTimer to nextFlareTimer
              jet.flareState.nextFlareTimer = TIME_BETWEEN_FLARE_PAIRS;
            }
          }
        }

        return {
          ...jet,
          position: convertFromVector3(position),
          velocity: convertFromVector3(velocity),
          quaternion: convertFromQuaternion(quaternion),
        };
      };

      const updatedAllied = battleState.alliedJets.map(updateJet);
      const updatedEnemy = battleState.enemyJets.map(updateJet);

      // Update combat effects
      // Update tracers
      const updatedTracers = newTracers.map(tracer => ({
        ...tracer,
        position: tracer.position.clone().add(tracer.velocity.clone().multiplyScalar(delta)),
        life: tracer.life - delta,
      })).filter(tracer => tracer.life > 0);

      // Update missiles
      const updatedMissiles = newMissiles.map(missile => {
        const missileState = {...missile};
        const currentTarget = allJets.find(j => j.id === missileState.targetId && !j.isWrecked && !j.isDestroyed);

        if (missileState.id.startsWith('m_forced_') && currentTarget) {
          // This is a "cheater" missile for scripted events. It moves directly towards the target.
          const targetPosition = convertToVector3(currentTarget.position);
          const newPosition = missileState.position.clone().lerp(targetPosition, 0.08); // SLOWED DOWN: Move 8% of the way to the target each frame.
          const newVelocity = new THREE.Vector3().subVectors(targetPosition, missileState.position).normalize().multiplyScalar(MISSILE_SPEED * 2); // Make it look fast

          const newQuaternion = new THREE.Quaternion();
          newQuaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), newVelocity.clone().normalize());

          return {
            ...missileState,
            position: newPosition,
            velocity: newVelocity, // Update velocity to keep smoke trail looking right
            quaternion: newQuaternion,
            life: missileState.life - delta,
          };

        } else {
          // Standard missile physics
          const newVelocity = missileState.velocity.clone();
  
          if (currentTarget) {
            const targetForward = new THREE.Vector3(0, 0, 1).applyQuaternion(convertToQuaternion(currentTarget.quaternion));
            const leadPoint = convertToVector3(currentTarget.position).clone().add(targetForward.multiplyScalar(LEAD_TARGET_DISTANCE));
  
            const desiredDirection = leadPoint.sub(missileState.position).normalize();
            const desiredVelocity = desiredDirection.multiplyScalar(MISSILE_SPEED);
  
            newVelocity.lerp(desiredVelocity, delta * MISSILE_TURN_SPEED);
          }
  
          newVelocity.normalize().multiplyScalar(MISSILE_SPEED);
          const newPosition = missileState.position.clone().add(newVelocity.clone().multiplyScalar(delta));
          const newQuaternion = new THREE.Quaternion();
          newQuaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), newVelocity.clone().normalize());
  
          return {
            ...missileState,
            position: newPosition,
            velocity: newVelocity,
            quaternion: newQuaternion,
            life: missileState.life - delta,
          };
        }
      }).filter(missile => missile.life > 0);

      // Update flares
      const updatedFlares = newFlares.map(flare => {
        const newVelocity = flare.velocity.clone();
        newVelocity.y -= 9.8 * delta; // Gravity
        newVelocity.multiplyScalar(1 - (delta * FLARE_DRAG)); // Drag

        return {
          ...flare,
          position: flare.position.clone().add(newVelocity.clone().multiplyScalar(delta)),
          velocity: newVelocity,
          life: flare.life - delta,
        };
      }).filter(flare => flare.life > 0);

      // Handle respawns
      if (respawnEnabled) {
        const respawnJets = (jets: BattleEntity[]): BattleEntity[] => {
          return jets.map(jet => {
            if ((jet.isDestroyed || jet.isWrecked) && jet.destroyedAt && Date.now() - jet.destroyedAt > RESPAWN_TIME) {
              // Respawn the jet
              const angle = Math.random() * Math.PI * 2;
              const radius = jet.team === 'allied' ? 40 : 60;
              return {
                ...jet,
                isDestroyed: false,
                isWrecked: false,
                destroyedAt: null,
                wreckageAngularVelocity: null,
                position: [
                  Math.cos(angle) * radius,
                  (Math.random() - 0.5) * 20, // Random height
                  Math.sin(angle) * radius,
                ] as [number, number, number],
                velocity: [0, 0, 0],
                quaternion: [0, 0, 0, 1], // Identity quaternion
                health: jet.maxHealth,
                fireCooldown: Math.random() * 3,
                burstState: { active: false, burstsLeft: 0, tracersLeftInBurst: 0, nextShotTimer: 0, isKillShot: false },
                flareState: { deploying: false, flaresLeft: 0, nextFlareTimer: 0 },
              };
            }
            return jet;
          });
        };

        const respawnedAllied = respawnJets(updatedAllied);
        const respawnedEnemy = respawnJets(updatedEnemy);

        setBattleState((prev) =>
          prev
            ? {
                ...prev,
                alliedJets: respawnedAllied,
                enemyJets: respawnedEnemy,
                executedEvents: [...prev.executedEvents, ...newExecutedEvents],
                tracers: updatedTracers,
                missiles: updatedMissiles,
                flares: updatedFlares,
              }
            : null
        );
      } else {
        setBattleState((prev) =>
          prev
            ? {
                ...prev,
                alliedJets: updatedAllied,
                enemyJets: updatedEnemy,
                executedEvents: [...prev.executedEvents, ...newExecutedEvents],
                tracers: updatedTracers,
                missiles: updatedMissiles,
                flares: updatedFlares,
              }
            : null
        );
      }
    }, 16); // ~60 FPS

    return () => clearInterval(interval);
  }, [battleState]);

  const forceEndBattle = useCallback(() => {
    setBattleState(prev =>
      prev ? {
        ...prev,
        status: prev.results?.victory ? 'victory' : 'defeat', // Use pre-calculated result for forced end
        endTime: Date.now(),
      } : null
    );
  }, []);

  return { battleState, initializeBattle, forceEndBattle };
};