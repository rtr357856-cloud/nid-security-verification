import type { MessagingPlatform } from "@/types/database";

import { detectOs } from "@/lib/ua";

type DeepLinkInput = {
  platform: MessagingPlatform;
  recipientNumber: string;
  message: string;
  userAgent?: string;
};

/**
 * Build a platform-specific deep link with the recipient and message pre-filled.
 *
 * SMS:
 *  - Android: `sms:1223?body=...`
 *  - iOS:     `sms:1223&body=...`  (iOS uses `&` instead of `?`)
 *
 * WhatsApp:  `https://wa.me/<number>?text=...`
 * Telegram:  `https://t.me/+<number>?text=...`
 */
export function buildDeepLink({
  platform,
  recipientNumber,
  message,
  userAgent = "",
}: DeepLinkInput): string {
  const text = encodeURIComponent(message);

  switch (platform) {
    case "sms": {
      const os = detectOs(userAgent);
      const sep = os === "ios" ? "&" : "?";
      return `sms:${recipientNumber}${sep}body=${text}`;
    }
    case "whatsapp": {
      return `https://wa.me/${sanitizeNumber(recipientNumber)}?text=${text}`;
    }
    case "telegram": {
      return `https://t.me/+${sanitizeNumber(recipientNumber)}?text=${text}`;
    }
    default:
      return `sms:${recipientNumber}?body=${text}`;
  }
}

function sanitizeNumber(value: string): string {
  // WhatsApp/Telegram require international format digits.
  return value.replace(/[^\d+]/g, "").replace(/^0+/, "");
}
