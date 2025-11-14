import { BattleEntity, BattleEvent, BattleResults } from '../types/combat.types';
import { FighterJet, Pilot, Mission } from '../types/game.types';

// --- HELPER TYPES and INTERFACES for internal simulation ---
interface SimEntity {
  id: string;
  team: 'allied' | 'enemy';
  isAlive: boolean;
  // Individual stats for weighted calculations
  weaponStrength: number;
  speed: number;
  agility: number;
  intelligence: number;
  // For allied jets to link back to pilots
  pilotId?: string;
}

// --- CONSTANTS for easier balancing ---
const BATTLE_DURATION = 30000; // 30 seconds
const BASE_HIT_CHANCE = 0.5; // Base 50% chance to hit before stats
const AGILITY_HIT_MODIFIER = 0.005; // Each point of agility difference modifies hit chance by 0.5%
const BASE_KILL_CHANCE = 0.15; // On a successful hit, base 15% chance it's a kill
const WEAPON_KILL_MODIFIER = 0.002; // Each point of weapon strength modifies kill chance by 0.2%
const FLEE_THRESHOLD = 0.4; // Enemies consider fleeing when their forces are below 40%

// ====================================================================================
// --- MAIN EXPORTED FUNCTION ---
// ====================================================================================
export const calculateBattleOutcome = (
  squadron: FighterJet[],
  pilots: Pilot[],
  mission: Mission,
  tactic: 'aggressive' | 'defensive'
): { events: BattleEvent[]; results: BattleResults } => {
  // 1. Calculate overall power levels (this remains a good high-level check for victory)
  const alliedPower = calculateSquadronPower(squadron, pilots);
  const enemyPower = calculateEnemyPower(mission);
  const tacticModifier = tactic === 'aggressive' ? 1.15 : 1.0; // Slightly toned down modifier
  const adjustedAlliedPower = alliedPower * tacticModifier;
  const alliedWins = adjustedAlliedPower > enemyPower;

  // 2. Generate the detailed, stats-driven battle events
  const events = generateBattleEvents(squadron, pilots, mission, alliedWins);

  // 3. Calculate final results based on the *actual* events that occurred
  const results = calculateResultsFromEvents(squadron, mission, events, alliedWins);

  return { events, results };
};

// ====================================================================================
// --- POWER CALCULATION (Unchanged) ---
// ====================================================================================
const calculateSquadronPower = (squadron: FighterJet[], pilots: Pilot[]): number => {
  return squadron.reduce((total, jet) => {
    const pilot = pilots.find((p) => p.id === jet.assignedPilotId);
    if (!pilot) return total;
    const jetPower = jet.computedStats.weaponStrength + jet.computedStats.speed + jet.computedStats.agility;
    const pilotPower = pilot.intelligence + pilot.endurance;
    return total + jetPower + pilotPower;
  }, 0);
};

const calculateEnemyPower = (mission: Mission): number => {
  const stats = mission.enemyStats;
  const singleEnemyPower = stats.weaponStrength + stats.speed + stats.agility + stats.intelligence + stats.endurance;
  return singleEnemyPower * mission.enemyCount;
};


// ====================================================================================
// --- BATTLE EVENT GENERATION (Completely Overhauled) ---
// ====================================================================================
const generateBattleEvents = (
  squadron: FighterJet[],
  pilots: Pilot[],
  mission: Mission,
  alliedWins: boolean
): BattleEvent[] => {
  const events: BattleEvent[] = [];
  
  // Create detailed lists of all combatants for simulation
  const alliedEntities: SimEntity[] = squadron.map((jet, i) => {
    const pilot = pilots.find(p => p.id === jet.assignedPilotId) || { intelligence: 50, endurance: 50 };
    return {
      id: `allied-${i}`,
      team: 'allied',
      isAlive: true,
      weaponStrength: jet.computedStats.weaponStrength,
      speed: jet.computedStats.speed,
      agility: jet.computedStats.agility,
      intelligence: pilot.intelligence,
      pilotId: pilot.id,
    };
  });
  const enemyEntities: SimEntity[] = Array.from({ length: mission.enemyCount }, (_, i) => ({
    id: `enemy-${i}`,
    team: 'enemy',
    isAlive: true,
    ...mission.enemyStats,
  }));

  let battleTime = 0;

  // Main simulation loop: continues until one side is wiped out or time runs out
  while (battleTime < BATTLE_DURATION) {
    let aliveAllies = alliedEntities.filter(e => e.isAlive);
    let aliveEnemies = enemyEntities.filter(e => e.isAlive);
    
    if (aliveAllies.length === 0 || aliveEnemies.length === 0) break;

    // Advance time with some randomness for more organic pacing
    battleTime += 1500 + Math.random() * 2000; // Events happen every 1.5 - 3.5 seconds
    if (battleTime > BATTLE_DURATION) battleTime = BATTLE_DURATION;

    // Decide who attacks based on the sum of 'speed' and 'intelligence' of remaining jets
    const alliedInitiative = aliveAllies.reduce((sum, jet) => sum + jet.speed + jet.intelligence, 0);
    const enemyInitiative = aliveEnemies.reduce((sum, jet) => sum + jet.speed + jet.intelligence, 0);
    const totalInitiative = alliedInitiative + enemyInitiative;
    
    const isAlliedAttack = Math.random() < (alliedInitiative / totalInitiative);
    
    const attackers = isAlliedAttack ? aliveAllies : aliveEnemies;
    const defenders = isAlliedAttack ? aliveEnemies : aliveAllies;
    
    // Pick a random attacker and defender from the alive pools
    const attacker = attackers[Math.floor(Math.random() * attackers.length)];
    const target = defenders[Math.floor(Math.random() * defenders.length)];

    // Calculate hit chance based on attacker's intelligence vs target's agility
    const agilityDiff = attacker.intelligence - target.agility;
    const hitChance = BASE_HIT_CHANCE + (agilityDiff * AGILITY_HIT_MODIFIER);
    const doesHit = Math.random() < hitChance;
    
    if (doesHit) {
      // Calculate kill chance based on attacker's weapon strength
      const killChance = BASE_KILL_CHANCE + (attacker.weaponStrength * WEAPON_KILL_MODIFIER);
      const isKill = Math.random() < killChance;
      
      if (isKill && target.isAlive) {
        // Only allow a "kill" if it aligns with the battle's pre-determined outcome
        // This prevents a lucky roll from making the winning team lose all their jets.
        const canKill = (isAlliedAttack && alliedWins) || (!isAlliedAttack && !alliedWins) || (defenders.length > 1);
        
        if (canKill) {
          events.push({
            timestamp: battleTime,
            type: 'destroy',
            attackerId: attacker.id,
            targetId: target.id,
            damage: 100,
          });
          // Update the entity's state so it can't be targeted or attack again
          const targetInMasterList = (isAlliedAttack ? enemyEntities : alliedEntities).find(e => e.id === target.id);
          if (targetInMasterList) targetInMasterList.isAlive = false;
        }
      } else {
        // It's just a regular hit
        events.push({
          timestamp: battleTime,
          type: 'hit',
          attackerId: attacker.id,
          targetId: target.id,
          damage: Math.round(10 + attacker.weaponStrength / 10), // Damage scales with weapon
        });
      }
    }
  }

  // --- Post-Battle Events: Enemy Escape Logic ---
  const remainingEnemies = enemyEntities.filter(e => e.isAlive);
  // The losing enemy side might flee near the end of the battle if they are losing badly
  if (alliedWins && remainingEnemies.length > 0 && remainingEnemies.length / mission.enemyCount < FLEE_THRESHOLD) {
    const fleeTime = BATTLE_DURATION * 0.8 + Math.random() * 2000;
    remainingEnemies.forEach((enemy, i) => {
      events.push({
        timestamp: fleeTime + i * 200, // Staggered escape
        type: 'escape',
        attackerId: enemy.id, // In this context, the one escaping
        targetId: '', // No target
      });
    });
  }

  return events.sort((a, b) => a.timestamp - b.timestamp);
};


// ====================================================================================
// --- FINAL RESULTS CALCULATION (Completely Overhauled) ---
// ====================================================================================
const calculateResultsFromEvents = (
  squadron: FighterJet[],
  mission: Mission,
  events: BattleEvent[],
  alliedWins: boolean
): BattleResults => {
  // Initialize pilot stats tracking object
  const pilotStatsMap: { [key: string]: { pilotId: string; kills: number; damage: number; survival: boolean } } = {};
  squadron.forEach((jet, i) => {
    const pilotId = jet.assignedPilotId || `unknown-${i}`;
    pilotStatsMap[`allied-${i}`] = { pilotId, kills: 0, damage: 0, survival: true };
  });

  let destroyedAlliedCount = 0;
  let destroyedEnemyCount = 0;

  // Process the events to get accurate stats
  for (const event of events) {
    if (event.type === 'hit' || event.type === 'destroy') {
      const attackerStats = pilotStatsMap[event.attackerId];
      if (attackerStats) {
        attackerStats.damage += event.damage;
      }

      if (event.type === 'destroy') {
        const targetStats = pilotStatsMap[event.targetId];
        if (targetStats) { // Allied jet was destroyed
          targetStats.survival = false;
          destroyedAlliedCount++;
        } else { // Enemy jet was destroyed
          destroyedEnemyCount++;
          if (attackerStats) {
            attackerStats.kills++;
          }
        }
      }
    }
  }

  const enemiesEscaped = events.filter((e) => e.type === 'escape').length;
  const survivingAllied = squadron.length - destroyedAlliedCount;
  const survivingEnemy = mission.enemyCount - destroyedEnemyCount - enemiesEscaped;
  const rewardMultiplier = alliedWins ? 1.0 : 0.3;

  return {
    victory: alliedWins,
    survivingAllied,
    destroyedAllied: destroyedAlliedCount,
    survivingEnemy,
    destroyedEnemy: destroyedEnemyCount,
    enemiesEscaped,
    duration: BATTLE_DURATION,
    rewards: {
      credits: Math.floor(mission.rewards.credits * rewardMultiplier),
      researchPoints: Math.floor(mission.rewards.researchPoints * rewardMultiplier),
      highScoreBonus: Math.floor(mission.rewards.highScoreBonus * rewardMultiplier),
    },
    pilotStats: Object.values(pilotStatsMap),
  };
};