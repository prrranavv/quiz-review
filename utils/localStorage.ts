/**
 * Safe localStorage utilities to prevent JSON parsing errors
 */

export const safeGetFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  
  try {
    const item = localStorage.getItem(key);
    
    // Check for invalid values that would cause JSON.parse to fail
    if (!item || item === 'undefined' || item === 'null' || item === '') {
      return defaultValue;
    }
    
    const parsed = JSON.parse(item);
    return parsed !== null && parsed !== undefined ? parsed : defaultValue;
  } catch (error) {
    console.warn(`Failed to parse localStorage item "${key}":`, error);
    // Remove invalid item from localStorage
    localStorage.removeItem(key);
    return defaultValue;
  }
};

export const safeSetToLocalStorage = <T>(key: string, value: T): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Failed to save to localStorage "${key}":`, error);
    return false;
  }
};

export const safeRemoveFromLocalStorage = (key: string): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove from localStorage "${key}":`, error);
    return false;
  }
}; 