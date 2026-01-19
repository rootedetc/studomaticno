const CACHE_PREFIX = 'libertas_cache_';

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function getCacheKey(key) {
  return `${CACHE_PREFIX}${key}`;
}

export function setDailyCache(key, value) {
  const cacheItem = {
    data: value,
    date: getTodayDate(),
    timestamp: Date.now()
  };
  
  try {
    localStorage.setItem(getCacheKey(key), JSON.stringify(cacheItem));
  } catch (error) {
    console.warn('Failed to set cache:', error);
  }
}

export function getDailyCache(key) {
  try {
    const cacheKey = getCacheKey(key);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) {
      return null;
    }
    
    const cacheItem = JSON.parse(cached);
    
    if (!cacheItem || !cacheItem.date) {
      return null;
    }
    
    if (isCacheStale(cacheItem.date)) {
      clearCache(key);
      return null;
    }
    
    return cacheItem.data;
  } catch (error) {
    console.warn('Failed to get cache:', error);
    return null;
  }
}

export function isCacheStale(cacheDate) {
  const today = getTodayDate();
  return cacheDate !== today;
}

export function clearCache(key) {
  try {
    localStorage.removeItem(getCacheKey(key));
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
}

export function clearAllDailyCache() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear all cache:', error);
  }
}

export function getCacheInfo(key) {
  try {
    const cached = localStorage.getItem(getCacheKey(key));
    if (!cached) return null;
    
    const cacheItem = JSON.parse(cached);
    const age = Date.now() - cacheItem.timestamp;
    
    return {
      date: cacheItem.date,
      timestamp: cacheItem.timestamp,
      age,
      isStale: isCacheStale(cacheItem.date)
    };
  } catch (error) {
    return null;
  }
}
