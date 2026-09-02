import type { ExtensionMessage, ExtensionState } from '@/types/messages';

const IS_EXTENSION: boolean =
  typeof chrome !== 'undefined' && chrome.runtime?.id !== undefined;

export function sendMessage<T extends ExtensionMessage>(
  message: T
): Promise<ExtensionState | undefined> {
  if (IS_EXTENSION) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('[Musync][Messaging] Error:', chrome.runtime.lastError.message);
          resolve(undefined);
        } else {
          resolve(response as ExtensionState);
        }
      });
    });
  }
  return Promise.resolve(undefined);
}

export function onMessage(
  callback: (message: ExtensionMessage, sender: chrome.runtime.MessageSender) => void
): (() => void) | undefined {
  if (!IS_EXTENSION) return undefined;

  const listener = (
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender
  ): boolean => {
    callback(message, sender);
    return false;
  };

  chrome.runtime.onMessage.addListener(listener);

  return () => chrome.runtime.onMessage.removeListener(listener);
}

export function isExtension(): boolean {
  return IS_EXTENSION;
}
