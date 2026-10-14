import '@testing-library/jest-dom';
import '@/i18n/config';

if (typeof window !== 'undefined') {
  // Mock matchMedia for jsdom
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });

  // Mock scrollTo
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: () => {},
  });

  // Fix for Node 22+ jsdom incompatibility with undici RequestInit.signal
  if (typeof globalThis.Request !== 'undefined') {
    const NativeRequest = globalThis.Request;
    globalThis.Request = class PatchedRequest extends NativeRequest {
      constructor(input: RequestInfo | URL, init?: RequestInit) {
        try {
          super(input, init);
        } catch (err) {
          if (init?.signal && err instanceof TypeError && String(err).includes('AbortSignal')) {
            const { signal: _signal, ...rest } = init;
            super(input, rest);
          } else {
            throw err;
          }
        }
      }
    };
  }
}
