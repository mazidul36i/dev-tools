/**
 * Type augmentations for non-standard browser APIs.
 */

interface NetworkInformation extends EventTarget {
  readonly type?: string;
  readonly effectiveType?: string;
  readonly downlink?: number;
  readonly rtt?: number;
  addEventListener(type: 'change', listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: 'change', listener: EventListenerOrEventListenerObject): void;
}

interface Navigator {
  readonly connection?: NetworkInformation;
}

interface Window {
  webkitAudioContext?: typeof AudioContext;
}

