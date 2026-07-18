/**
 * Parse user-agent to extract device details
 */
export function parseDeviceInfo(userAgent) {
  if (!userAgent) return { deviceName: 'Unknown', deviceType: 'unknown', browser: 'Unknown', os: 'Unknown' };
  
  const ua = userAgent.toLowerCase();
  let browser = 'Unknown';
  let os = 'Unknown';
  let deviceType = 'desktop';
  let deviceName = 'Unknown';
  
  // Browser detection
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';
  
  // OS detection
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  // Device type
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) deviceType = 'mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) deviceType = 'tablet';
  
  // Build device name
  const versionMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
  const browserVersion = versionMatch ? versionMatch[2] : '';
  deviceName = `${browser} ${browserVersion} on ${os}`.trim();
  
  return { deviceName, deviceType, browser, os };
}

/**
 * Get location from IP address using free API (with caching)
 */
const locationCache = new Map();

export async function getLocationFromIP(ipAddress) {
  if (!ipAddress || ipAddress === 'unknown' || ipAddress === '::1' || ipAddress.startsWith('127.')) {
    return 'Localhost';
  }
  
  if (locationCache.has(ipAddress)) {
    return locationCache.get(ipAddress);
  }
  
  try {
    // Using ip-api.com free tier (no API key required, 45 requests/minute)
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,city`);
    const data = await response.json();
    
    if (data.status === 'success') {
      const location = `${data.city}, ${data.country}`;
      locationCache.set(ipAddress, location);
      return location;
    }
  } catch (error) {
    console.error('[Location] Failed to get location:', error);
  }
  
  return 'Unknown';
}