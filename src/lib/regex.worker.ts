import { runRegex } from './regex-utils';

export interface RegexWorkerRequest {
  id: number;
  pattern: string;
  flags: string;
  text: string;
  replacement?: string;
}

// Runs user-supplied patterns off the main thread so catastrophic
// backtracking can be stopped by terminating the worker.
self.onmessage = (e: MessageEvent<RegexWorkerRequest>) => {
  const { id, pattern, flags, text, replacement } = e.data;
  const result = runRegex(pattern, flags, text, replacement);
  (self as unknown as Worker).postMessage({ id, result });
};
