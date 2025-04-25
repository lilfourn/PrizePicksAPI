/**
 * request-utils.js - Shared utilities for API requests
 * Includes caching, throttling, and identity rotation mechanisms
 */

const axios = require('axios');
const BASE_URL = process.env.BASE_URL;

// Cache configuration
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const cache = new Map();

// Rate limiting configuration - Randomized to appear more natural
const MIN_REQUEST_DELAY = 300; // Minimum delay between requests (ms)
const MAX_REQUEST_DELAY = 2000; // Maximum delay between requests (ms)
let lastRequestTime = 0;

/**
 * Creates a shared axios instance with common configuration
 */
const axiosInstance = axios.create({
  timeout: 30000, // 30 seconds timeout
  validateStatus: status => status < 500 // Treat only 500+ as errors
});

/**
 * Advanced identity rotation components
 */
// Extensive user agents list representing various browsers and devices
const USER_AGENTS = [
  // Desktop Chrome - Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  
  // Desktop Chrome - macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  
  // Desktop Firefox
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
  
  // Desktop Safari
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
  
  // Desktop Edge
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
  
  // Mobile - iOS (iPhone)
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1',
  
  // Mobile - Android
  'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
];

// Common screen resolutions to mimic different devices
const SCREEN_RESOLUTIONS = [
  // Desktop/Laptop
  '1920x1080', '2560x1440', '1366x768', '1536x864', '1440x900', '1600x900',
  // Mobile
  '375x812', '390x844', '360x740', '414x896', '412x915', '360x800',
  // Tablet
  '768x1024', '834x1194', '810x1080', '1280x800'
];

// Realistic Accept-Language variations
const LANGUAGE_PREFERENCES = [
  'en-US,en;q=0.9', 'en-GB,en;q=0.9', 'en-CA,en;q=0.9,fr-CA;q=0.8,fr;q=0.7',
  'es-ES,es;q=0.9,en;q=0.8', 'fr-FR,fr;q=0.9,en;q=0.8', 'de-DE,de;q=0.9,en;q=0.8',
  'en;q=0.9', 'en-US;q=0.9,en;q=0.8', 'en-US,en;q=0.5'
];

// Color schemes for webpage preferences
const COLOR_SCHEMES = ['light', 'dark', 'no-preference'];

// Platforms for Sec-Ch-Ua-Platform header
const PLATFORMS = [
  'Windows', 'macOS', 'Linux', 'Android', 'iOS', 'iPadOS',
  'Chrome OS', 'PlayStation', 'Xbox'
];

// Common viewport sizes
const VIEWPORT_SIZES = [
  // Desktop
  { width: 1920, height: 1080 }, { width: 1440, height: 900 }, 
  { width: 1366, height: 768 }, { width: 2560, height: 1440 },
  // Tablet
  { width: 768, height: 1024 }, { width: 1024, height: 768 },
  { width: 834, height: 1194 }, { width: 1112, height: 834 },
  // Mobile
  { width: 375, height: 812 }, { width: 390, height: 844 },
  { width: 360, height: 740 }, { width: 414, height: 896 }
];

// IP Rotation through proxy list
let proxyList = [];
let currentProxyIndex = 0;

// Initialize proxy list from environment variables if available
const initializeProxies = () => {
  if (process.env.PROXY_LIST) {
    proxyList = process.env.PROXY_LIST.split(',')
      .map(p => p.trim())
      .filter(p => p);
    console.log(`Loaded ${proxyList.length} proxies for IP rotation.`);
  }
};

// Try to initialize proxies on module load
initializeProxies();

/**
 * Gets a random item from an array
 * @param {Array} arr - Array to select from
 * @returns {*} - Random item from array
 */
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Generates a random number between min and max (inclusive)
 */
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Sleeps for the specified time
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after the specified time
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Applies randomized rate limiting to appear more human-like
 * @returns {Promise} - Promise that resolves when it's safe to make the next request
 */
const throttle = async () => {
  const now = Date.now();
  const timeElapsed = now - lastRequestTime;
  
  // Generate a random delay within our range
  const randomDelay = getRandomNumber(MIN_REQUEST_DELAY, MAX_REQUEST_DELAY);
  
  if (timeElapsed < randomDelay) {
    const waitTime = randomDelay - timeElapsed;
    console.log(`Throttling request for ${waitTime}ms to appear more natural`);
    await sleep(waitTime);
  }
  
  lastRequestTime = Date.now();
};

/**
 * Gets the next proxy from the rotation list
 * @returns {Object|null} - Proxy configuration or null if none available
 */
const getNextProxy = () => {
  if (!proxyList.length) return null;
  
  const proxy = proxyList[currentProxyIndex];
  // Rotate to the next proxy for the next request
  currentProxyIndex = (currentProxyIndex + 1) % proxyList.length;
  
  try {
    // Parse proxy URL (supports http://user:pass@host:port format)
    const proxyUrl = new URL(proxy);
    const config = {
      protocol: proxyUrl.protocol.replace(':', ''),
      host: proxyUrl.hostname,
      port: parseInt(proxyUrl.port, 10)
    };
    
    // Add authentication if provided
    if (proxyUrl.username && proxyUrl.password) {
      config.auth = {
        username: decodeURIComponent(proxyUrl.username),
        password: decodeURIComponent(proxyUrl.password)
      };
    }
    
    return config;
  } catch (err) {
    console.error(`Failed to parse proxy URL: ${proxy}`, err);
    return null;
  }
};

/**
 * Generates a realistic browser fingerprint to disguise requests
 * @returns {Object} - Headers and other request options to mimic a real browser
 */
const generateBrowserFingerprint = () => {
  // Select a random User-Agent
  const userAgent = getRandomItem(USER_AGENTS);
  
  // Determine if we're pretending to be mobile based on the UA
  const isMobile = userAgent.includes('Mobile') || userAgent.includes('Android');
  
  // Select appropriate viewport and screen resolution based on device type
  const viewport = getRandomItem(isMobile ? 
    VIEWPORT_SIZES.filter(v => v.width < 850) : 
    VIEWPORT_SIZES.filter(v => v.width >= 850)
  );
  
  const screenResolution = getRandomItem(isMobile ? 
    SCREEN_RESOLUTIONS.filter(r => parseInt(r.split('x')[0]) < 850) : 
    SCREEN_RESOLUTIONS.filter(r => parseInt(r.split('x')[0]) >= 850)
  );
  
  // Generate platform info based on UA
  let platform = 'Windows';
  if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS X')) {
    platform = 'macOS';
  } else if (userAgent.includes('Linux') && !userAgent.includes('Android')) {
    platform = 'Linux';
  } else if (userAgent.includes('Android')) {
    platform = 'Android';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    platform = 'iOS';
  }
  
  // Common headers for all browsers
  const headers = {
    'User-Agent': userAgent,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': getRandomItem(LANGUAGE_PREFERENCES),
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache',
    'sec-ch-ua-platform': `"${platform}"`,
    'sec-ch-ua-mobile': isMobile ? '?1' : '?0',
    'Sec-CH-UA': '"Chromium";v="112", "Google Chrome";v="112"', // Simplified for now
    'Referer': 'https://app.prizepicks.com/',
    'Origin': 'https://app.prizepicks.com'
  };
  
  // Browser-specific client hints
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    headers['sec-ch-ua'] = `"Google Chrome";v="${getRandomNumber(110, 120)}", "Chromium";v="${getRandomNumber(110, 120)}"`;
  } else if (userAgent.includes('Firefox')) {
    headers['sec-ch-ua'] = `"Firefox";v="${getRandomNumber(105, 115)}"`;
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    headers['sec-ch-ua'] = `"Safari";v="${getRandomNumber(15, 17)}"`;
  } else if (userAgent.includes('Edg')) {
    headers['sec-ch-ua'] = `"Microsoft Edge";v="${getRandomNumber(110, 120)}", "Chromium";v="${getRandomNumber(110, 120)}"`;
  }
  
  // Build the fingerprint object
  return {
    headers,
    // Return proxy configuration if available
    proxy: getNextProxy()
  };
};

/**
 * Gets data from cache if available and not expired
 * @param {string} key - Cache key
 * @returns {Object|null} - Cached data or null if not found/expired
 */
const getFromCache = (key) => {
  if (!cache.has(key)) return null;
  
  const { data, timestamp } = cache.get(key);
  const now = Date.now();
  
  // Check if cache is still valid
  if (now - timestamp < DEFAULT_CACHE_TTL) {
    console.log(`Cache hit for: ${key}`);
    return data;
  }
  
  // Cache expired, remove it
  console.log(`Cache expired for: ${key}`);
  cache.delete(key);
  return null;
};

/**
 * Saves data to cache with current timestamp
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 * @param {number} [ttl] - Optional custom TTL in milliseconds
 */
const saveToCache = (key, data, ttl = DEFAULT_CACHE_TTL) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
  console.log(`Cached data for: ${key}`);
};

/**
 * Enhanced HTTP GET function with caching, throttling, and identity rotation
 * @param {string} url - Full URL to request
 * @param {Object} options - Request options
 * @param {boolean} [useCache=true] - Whether to use cache
 * @param {number} [cacheTtl] - Optional custom cache TTL
 * @param {boolean} [rotateIdentity=true] - Whether to generate a new browser fingerprint
 * @returns {Promise<Object>} - Response data
 */
const smartGet = async (url, options = {}, useCache = true, cacheTtl, rotateIdentity = true) => {
  // Generate a unique cache key based on URL and provided options
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  
  // Try to get from cache if enabled
  if (useCache) {
    const cachedData = getFromCache(cacheKey);
    if (cachedData) return cachedData;
  }
  
  // Apply throttling to make requests appear more human-like
  await throttle();
  
  // Apply identity rotation if requested
  let requestOptions = { ...options };
  if (rotateIdentity) {
    const fingerprint = generateBrowserFingerprint();
    
    // Merge headers, giving precedence to custom headers from options
    requestOptions.headers = {
      ...fingerprint.headers,
      ...(options.headers || {})
    };
    
    // Add proxy if provided by fingerprint
    if (fingerprint.proxy) {
      requestOptions.proxy = fingerprint.proxy;
    }
  }
  
  try {
    // Make the request
    console.log(`Making request to ${url} with rotated identity`);
    const response = await axiosInstance.get(url, requestOptions);
    
    // Handle empty array responses
    if (response.status === 200 && 
        Array.isArray(response.data?.data) && 
        response.data.data.length === 0) {
      console.warn('Received empty array response, might be rate-limited or blocked');
    }
    
    // Cache the successful response if enabled
    if (useCache && response.status === 200) {
      saveToCache(cacheKey, response.data, cacheTtl);
    }
    
    return response.data;
  } catch (error) {
    // Enhance error handling
    console.error(`Request failed for ${url}:`, 
      error.response?.status || error.code || error.message);
    
    // Retry logic for certain errors
    if (error.response?.status === 429 || 
        error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT') {
      
      // Wait longer before retrying
      const retryDelay = getRandomNumber(2000, 5000);
      console.log(`Rate limited or connection issue, retrying after ${retryDelay}ms...`);
      await sleep(retryDelay);
      
      // Force new identity on retry
      return smartGet(url, options, useCache, cacheTtl, true);
    }
    
    throw error;
  }
};

/**
 * Clears expired items from cache
 */
const cleanupCache = () => {
  const now = Date.now();
  let expiredCount = 0;
  
  for (const [key, { timestamp, ttl }] of cache.entries()) {
    if (now - timestamp > (ttl || DEFAULT_CACHE_TTL)) {
      cache.delete(key);
      expiredCount++;
    }
  }
  
  if (expiredCount > 0) {
    console.log(`Cleaned up ${expiredCount} expired cache items`);
  }
};

// Run cache cleanup every 10 minutes
setInterval(cleanupCache, 10 * 60 * 1000);

module.exports = {
  axiosInstance,
  smartGet,
  throttle,
  getFromCache,
  saveToCache,
  cleanupCache,
  generateBrowserFingerprint
};