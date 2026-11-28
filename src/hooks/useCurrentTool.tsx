import { createContext, useContext } from 'react';
import type { ToolDefinition } from '../tools';

/** The tool rendered by the current /:slug route (null elsewhere). */
export const CurrentToolContext = createContext<ToolDefinition | null>(null);

export function useCurrentTool(): ToolDefinition | null {
  return useContext(CurrentToolContext);
}
