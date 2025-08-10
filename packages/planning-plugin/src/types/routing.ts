/**
 * Routing Types for Planning Plugin
 * Local definitions to avoid external dependencies
 */

export type TaskType = 'code' | 'analysis' | 'general' | 'planning' | 'documentation';

export interface RoutingPreferences {
  prefer_local?: boolean;
  prefer_fast?: boolean;
  max_response_time?: number; // seconds
  fallback_enabled?: boolean;
}

export interface TaskRequest {
  type: TaskType;
  content: string;
  complexity: number; // 1-5 scale
  project_id?: string;
  context?: string;
  preferences?: RoutingPreferences;
}

export interface RoutingDecision {
  model_type: 'ollama' | 'claude' | 'local' | 'remote';
  model_name: string;
  confidence: number; // 0-1 scale
  reasoning: string;
}