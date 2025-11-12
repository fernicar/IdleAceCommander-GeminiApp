import { BattleEntity, BattleEvent, BattleResults } from '@/types/combat.types';
import { FighterJet, Pilot, Mission } from '@/types/game.types';

export const calculateBattleOutcome = (
  squadron: FighterJet[],
  pilots: Pilot[],
  mission: Mission,
  tactic: 'aggressive' | 'defensive'
): { events: BattleEvent[]; results: BattleResults } => {
  // Calculate power levels
  const alliedPower = calculateSquadronPower(squadron, pilots);
  const enemyPower = calculateEnemyPower(mission);

  // Apply tactical modifiers
  const tacticModifier = tactic === 'aggressive' ? 1.2 : 1.0;
  const adjustedAlliedPower = alliedPower * tacticModifier;

  // Determine winner
  const alliedWins = adjustedAlliedPower > enemyPower;

  // Generate battle events
  const events = generateBattleEvents(squadron, mission, alliedWins);

  // Calculate results
  const results = calculateResults(squadron, mission, events, alliedWins);

  return { events, results };
};

const calculateSquadronPower = (squadron: FighterJet[], pilots: Pilot[]): number => {
  return squadron.reduce((total, jet) => {
    const pilot = pilots.find((p) => p.id === jet.assignedPilotId);
    if (!pilot) return total;

    const jetPower =
      jet.computedStats.weaponStrength +
      jet.computedStats.speed +
      jet.computedStats.agility;

    const pilotPower = pilot.intelligence + pilot.endurance;

    return total + jetPower + pilotPower;
  }, 0);
};

const calculateEnemyPower = (mission: Mission): number => {
  const stats = mission.enemyStats;
  const singleEnemyPower =
    stats.weaponStrength + stats.speed + stats.agility + stats.intelligence + stats.endurance;
  return singleEnemyPower * mission.enemyCount;
};

const generateBattleEvents = (
  squadron: FighterJet[],
  mission: Mission,
  alliedWins: boolean
): BattleEvent[] => {
  const events: BattleEvent[] = [];
  const battleDuration = 30000; // 30 seconds
  const eventCount = Math.floor(Math.random() * 10) + 15; // 15-25 events

  let alliedJetsAlive = squadron.length;
  let enemyJetsAlive = mission.enemyCount;

  for (let i = 0; i < eventCount; i++) {
    const timestamp = (i / eventCount) * battleDuration;

    // Determine if this is a hit or miss
    const isHit = Math.random() > 0.3; // 70% hit rate

    if (isHit) {
      // Decide who scores the hit
      const alliedScores = alliedWins
        ? Math.random() > 0.4 // Allies score 60% of hits if winning
        : Math.random() > 0.6; // Allies score 40% of hits if losing

      if (alliedScores && enemyJetsAlive > 0) {
        // Allied jet hits enemy
        const attackerId = `allied-${Math.floor(Math.random() * squadron.length)}`;
        const targetId = `enemy-${Math.floor(Math.random() * enemyJetsAlive)}`;

        // Determine if this kills the enemy
        const isKill = Math.random() > 0.7; // 30% chance of kill on hit

        if (isKill && i > eventCount / 2) {
          // Only kills in second half of battle
          events.push({
            timestamp,
            type: 'destroy',
            attackerId,
            targetId,
            damage: 100,
          });
          enemyJetsAlive--;
        } else {
          events.push({
            timestamp,
            type: 'hit',
            attackerId,
            targetId,
            damage: 20,
          });
        }
      } else if (!alliedScores && alliedJetsAlive > 0) {
        // Enemy jet hits allied
        const attackerId = `enemy-${Math.floor(Math.random() * mission.enemyCount)}`;
        const targetId = `allied-${Math.floor(Math.random() * alliedJetsAlive)}`;

        const isKill = Math.random() > 0.7;

        if (isKill && i > eventCount / 2 && !alliedWins) {
          // Allies only lose jets if they're losing
          events.push({
            timestamp,
            type: 'destroy',
            attackerId,
            targetId,
            damage: 100,
          });
          alliedJetsAlive--;
        } else {
          events.push({
            timestamp,
            type: 'hit',
            attackerId,
            targetId,
            damage: 20,
          });
        }
      }
    }
  }

  // Enemy flight chance
  if (!alliedWins && Math.random() > 0.5) {
    // 50% chance enemies flee if winning
    const fleeTime = battleDuration * 0.8;
    for (let i = 0; i < enemyJetsAlive; i++) {
      events.push({
        timestamp: fleeTime + i * 1000,
        type: 'escape',
        attackerId: `enemy-${i}`,
        targetId: '',
      });
    }
  }

  return events.sort((a, b) => a.timestamp - b.timestamp);
};

const calculateResults = (
  squadron: FighterJet[],
  mission: Mission,
  events: BattleEvent[],
  alliedWins: boolean
): BattleResults => {
  const destroyedAllied = events.filter(
    (e) => e.type === 'destroy' && e.targetId.startsWith('allied-')
  ).length;

  const destroyedEnemy = events.filter(
    (e) => e.type === 'destroy' && e.targetId.startsWith('enemy-')
  ).length;

  const enemiesEscaped = events.filter((e) => e.type === 'escape').length;

  const survivingAllied = squadron.length - destroyedAllied;
  const survivingEnemy = mission.enemyCount - destroyedEnemy - enemiesEscaped;

  // Calculate rewards (full if win, partial if loss)
  const rewardMultiplier = alliedWins ? 1.0 : 0.3;

  return {
    victory: alliedWins,
    survivingAllied,
    destroyedAllied,
    survivingEnemy,
    destroyedEnemy,
    enemiesEscaped,
    duration: 30000,
    rewards: {
      credits: Math.floor(mission.rewards.credits * rewardMultiplier),
      researchPoints: Math.floor(mission.rewards.researchPoints * rewardMultiplier),
      highScoreBonus: Math.floor(mission.rewards.highScoreBonus * rewardMultiplier),
    },
    pilotStats: squadron.map((jet, i) => ({
      pilotId: jet.assignedPilotId || '',
      kills: destroyedEnemy > i ? 1 : 0,
      damage: Math.floor(Math.random() * 100),
      survival: i >= destroyedAllied,
    })),
  };
};
