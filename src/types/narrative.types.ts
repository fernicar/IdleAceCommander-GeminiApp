// ============================================
// AI NARRATIVE SYSTEM
// ============================================

export interface NarrativeState {
  dialogues: Dialogue[];
  currentDialogue: Dialogue | null;
  warProgress: WarProgress;
  generalMood: 'optimistic' | 'neutral' | 'concerned' | 'desperate';
}

export interface Dialogue {
  id: string;
  type: 'mission-brief' | 'mission-result' | 'war-update' | 'promotion' | 'tech-unlock';
  speaker: 'general-martin';
  text: string;
  timestamp: number;
  dismissed: boolean;
  metadata?: {
    missionId?: string;
    victory?: boolean;
    casualtyCount?: number;
  };
}

export interface WarProgress {
  currentTheater: string;
  enemyStrength: 'weak' | 'moderate' | 'strong' | 'overwhelming';
  allyMorale: number;        // 0-100
  territoryControl: number;  // 0-100
  lastUpdate: number;
  statusDescription: string;
}

// ============================================
// LLM API TYPES
// ============================================

export interface OpenRouterRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
