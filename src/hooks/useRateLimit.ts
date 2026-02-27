import { useRef, useCallback } from "react";

export function useRateLimit(limitMs: number = 5000, maxAttempts: number = 3, windowMs: number = 60000) {
  const lastCall = useRef(0);
  const attempts = useRef<number[]>([]);

  const checkLimit = useCallback((): { allowed: boolean; message?: string } => {
    const now = Date.now();

    // Cooldown between calls
    if (now - lastCall.current < limitMs) {
      const wait = Math.ceil((limitMs - (now - lastCall.current)) / 1000);
      return { allowed: false, message: `Aguarde ${wait}s antes de tentar novamente.` };
    }

    // Sliding window rate limit
    attempts.current = attempts.current.filter((t) => now - t < windowMs);
    if (attempts.current.length >= maxAttempts) {
      const oldest = attempts.current[0];
      const resetIn = Math.ceil((windowMs - (now - oldest)) / 1000);
      return { allowed: false, message: `Muitas tentativas. Tente novamente em ${resetIn}s.` };
    }

    attempts.current.push(now);
    lastCall.current = now;
    return { allowed: true };
  }, [limitMs, maxAttempts, windowMs]);

  return { checkLimit };
}
