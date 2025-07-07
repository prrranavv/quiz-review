/**
 * Utility function to retry operations that might fail due to network issues
 * @param operation - The async operation to retry
 * @param maxRetries - Maximum number of retry attempts (default: 2)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @returns Promise that resolves with the operation result
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error = new Error('Operation failed');
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Only retry on network-related errors
      if (attempt < maxRetries && lastError.message.includes('Failed to fetch')) {
        console.log(`Retrying operation (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, baseDelay * (attempt + 1)));
      } else {
        // Don't retry on other types of errors or if max retries reached
        break;
      }
    }
  }
  
  throw lastError;
}

/**
 * Check if an error is a network-related error that should be retried
 * @param error - The error to check
 * @returns boolean indicating if the error should be retried
 */
export function isRetryableError(error: Error): boolean {
  return error.message.includes('Failed to fetch') || 
         error.message.includes('Network Error') ||
         error.message.includes('fetch failed');
}

/**
 * Get a user-friendly error message for network errors
 * @param error - The error to get a message for
 * @returns User-friendly error message
 */
export function getNetworkErrorMessage(error: Error): string {
  if (isRetryableError(error)) {
    return 'Network connection issue. Please check your internet connection and try again.';
  }
  
  return error.message || 'An unexpected error occurred.';
} 