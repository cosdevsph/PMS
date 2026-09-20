export interface DeviceInfo {
  os: string;
  browser: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  screenResolution: string;
  viewport: string;
  language: string;
  timezone: string;
  online: boolean;
  platform: string;
}

/**
 * Detects client device, operating system, browser, and display specifications.
 */
export const detectClientDevice = (): DeviceInfo => {
  if (typeof window === 'undefined') {
    return {
      os: 'Unknown OS',
      browser: 'Unknown Browser',
      deviceType: 'Desktop',
      screenResolution: 'Unknown',
      viewport: 'Unknown',
      language: 'en',
      timezone: 'UTC',
      online: true,
      platform: 'Unknown',
    };
  }

  const userAgent = navigator.userAgent || '';
  const width = window.innerWidth;

  // 1. Detect Device Type
  let deviceType: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';
  const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTabletUA = /iPad|Tablet/i.test(userAgent) || (navigator.maxTouchPoints > 1 && width >= 768 && width <= 1024);

  if (isTabletUA || (width >= 640 && width <= 1024 && navigator.maxTouchPoints > 0)) {
    deviceType = 'Tablet';
  } else if (isMobileUA || width < 640) {
    deviceType = 'Mobile';
  }

  // 2. Detect Operating System
  let os = 'Unknown OS';
  if (/Macintosh|Mac OS X/i.test(userAgent)) {
    os = 'macOS';
  } else if (/Windows/i.test(userAgent)) {
    os = 'Windows';
  } else if (/Android/i.test(userAgent)) {
    os = 'Android';
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    os = 'iOS';
  } else if (/Linux/i.test(userAgent)) {
    os = 'Linux';
  } else if (/CrOS/i.test(userAgent)) {
    os = 'Chrome OS';
  }

  // 3. Detect Web Browser
  let browser = 'Unknown Browser';
  if (/Edg\//i.test(userAgent)) {
    browser = 'Microsoft Edge';
  } else if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) {
    browser = 'Google Chrome';
  } else if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) {
    browser = 'Apple Safari';
  } else if (/Firefox\//i.test(userAgent)) {
    browser = 'Mozilla Firefox';
  } else if (/OPR\//i.test(userAgent) || /Opera/i.test(userAgent)) {
    browser = 'Opera';
  }

  // 4. Timezone & Language
  let timezone = 'UTC';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Manila';
  } catch {
    timezone = 'Asia/Manila';
  }

  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  const viewport = `${window.innerWidth}x${window.innerHeight}`;

  return {
    os,
    browser,
    deviceType,
    screenResolution,
    viewport,
    language: navigator.language || 'en',
    timezone,
    online: navigator.onLine,
    platform: navigator.platform || 'Web',
  };
};

/**
 * Generates a stable device fingerprint string based on hardware and browser specs.
 */
export const getDeviceFingerprint = (device?: DeviceInfo): string => {
  const d = device || detectClientDevice();
  const raw = `${d.os}__${d.browser}__${d.deviceType}__${d.screenResolution}__${d.timezone}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return `dev_${Math.abs(hash).toString(36)}`;
};
