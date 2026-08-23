export type DeviceInfo = {
  device_type: "Mobile" | "Tablet" | "Desktop" | "Bot";
  browser: string;
  os: string;
};

export function parseUserAgent(ua: string): DeviceInfo {
  const value = ua || "";

  let os = "Unknown";
  if (/windows nt/i.test(value)) os = "Windows";
  else if (/android/i.test(value)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(value)) os = "iOS";
  else if (/mac os x/i.test(value)) os = "macOS";
  else if (/linux/i.test(value)) os = "Linux";

  let device_type: DeviceInfo["device_type"] = "Desktop";
  if (/ipad|tablet/i.test(value)) device_type = "Tablet";
  else if (/mobi|android.*mobile|iphone/i.test(value)) device_type = "Mobile";
  else if (/bot|crawl|spider|slurp|bingpreview|facebookexternalhit/i.test(value))
    device_type = "Bot";

  let browser = "Unknown";
  if (/edg\//i.test(value)) browser = "Edge";
  else if (/opr\/|opera/i.test(value)) browser = "Opera";
  else if (/crios|chrome/i.test(value)) browser = "Chrome";
  else if (/fxios|firefox/i.test(value)) browser = "Firefox";
  else if (/safari/i.test(value)) browser = "Safari";
  else if (/msie|trident/i.test(value)) browser = "Internet Explorer";

  return { device_type, browser, os };
}

export type DeviceOs = "ios" | "android" | "other";

export function detectOs(ua: string): DeviceOs {
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "other";
}
