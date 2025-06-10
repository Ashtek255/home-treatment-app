export async function retryFetch<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let lastError: Error

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      console.log(`Attempt ${i + 1} failed. ${i < maxRetries - 1 ? "Retrying..." : "Max retries reached."}`)
      lastError = error as Error

      if (i < maxRetries - 1) {
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, i) + Math.random() * 1000
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError!
}

export function createRetryableFunction<T extends any[], R>(fn: (...args: T) => Promise<R>, maxRetries = 3) {
  return (...args: T): Promise<R> => {
    return retryFetch(() => fn(...args), maxRetries)
  }
}
