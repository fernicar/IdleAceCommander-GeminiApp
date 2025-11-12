import { Mission } from '@/types/game.types';
import { BattleResults } from '@/types/combat.types';
import { ChatMessage, WarProgress } from '@/types/narrative.types';

export const generateMissionBriefingPrompt = (
  mission: Mission,
  warProgress: WarProgress
): ChatMessage[] => {
  const systemPrompt = `You are General Martin, a stern but fair military commander. You speak in a professional military tone, using appropriate terminology. Keep responses under 150 words. Be direct and focused on the mission at hand.`;

  const userPrompt = `Brief the pilot on this mission:

Mission: ${mission.name}
Difficulty: ${mission.difficulty}
Enemy Count: ${mission.enemyCount}
Theater: ${warProgress.currentTheater}
Current War Status: ${warProgress.statusDescription}

Provide a tactical briefing that:
1. Acknowledges the mission difficulty
2. Mentions enemy strength
3. Offers strategic advice
4. Ends with words of encouragement

Keep it under 150 words. Be direct and military in tone.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
};

export const generateMissionResultsPrompt = (
  mission: Mission,
  results: BattleResults,
  warProgress: WarProgress
): ChatMessage[] => {
  const systemPrompt = `You are General Martin, a stern but fair military commander. React to the mission outcome with appropriate emotion - pride for victories, concern for losses. Keep responses under 150 words.`;

  const userPrompt = `React to this mission outcome:

Mission: ${mission.name}
Result: ${results.victory ? 'VICTORY' : 'DEFEAT'}
Allied Casualties: ${results.destroyedAllied}/${results.survivingAllied + results.destroyedAllied}
Enemy Destroyed: ${results.destroyedEnemy}
Enemy Escaped: ${results.enemiesEscaped}

${
  results.victory
    ? 'Congratulate the pilot on the successful mission. Mention the strategic importance.'
    : 'Address the defeat honestly but encourage the pilot to learn and improve. Mention that this is war and losses happen.'
}

Keep it under 150 words. Be military in tone but show appropriate emotion.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
};

export const generateWarUpdatePrompt = (warProgress: WarProgress): ChatMessage[] => {
  const systemPrompt = `You are General Martin, providing a strategic war update. Be informative about the broader conflict beyond individual missions. Keep responses under 150 words.`;

  const userPrompt = `Provide a war status update:

Theater: ${warProgress.currentTheater}
Enemy Strength: ${warProgress.enemyStrength}
Ally Morale: ${warProgress.allyMorale}/100
Territory Control: ${warProgress.territoryControl}/100

Give an update on:
1. Overall war progress
2. Enemy activity
3. Allied strategy
4. What's at stake

Keep it under 150 words. Be strategic and informative.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
};

// Fallback messages if AI unavailable
export const FALLBACK_BRIEFING = "Pilot, this is General Martin. We've got enemy fighters in the sector. Your mission is to engage and eliminate them. Intel suggests they're well-armed, so stay sharp. Trust your training, watch your wingmen, and bring everyone home. Good luck out there. You're cleared for launch.";

export const FALLBACK_VICTORY = "Outstanding work, pilot! You've eliminated the enemy threat and protected our airspace. Your performance out there was exemplary. These victories add up - every mission brings us closer to winning this war. Return to base for debriefing. Well done.";

export const FALLBACK_DEFEAT = "Pilot, I won't sugarcoat it - that mission didn't go as planned. We lost good people out there. But this is war, and we learn from our losses. Analyze what went wrong, upgrade your equipment, train harder. We'll get them next time. Dismissed.";
