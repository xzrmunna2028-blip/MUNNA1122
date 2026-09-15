import type React from 'react';

/**
 * Helper to launch Microsoft Teams chat with fallback to Teams web or Skype protocol
 */
export const TEAMS_EMAIL = "codeflowsupport@gmail.com";
export const TELEGRAM_SUPPORT = "super_x_sms_support";
export const TELEGRAM_URL = `https://t.me/${TELEGRAM_SUPPORT}`;

// Direct Microsoft Teams deep-link URL & web chat URL
export const TEAMS_WEB_URL = `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(TEAMS_EMAIL)}`;
export const TEAMS_APP_URL = `msteams:/l/chat/0/0?users=${encodeURIComponent(TEAMS_EMAIL)}`;

/**
 * Open Microsoft Teams chat directly (attempts app deep link, opens Teams web / mail fallback)
 */
export function openTeamsChat(e?: React.MouseEvent) {
  if (e) {
    e.preventDefault();
  }
  // Open direct Teams chat web interface which also triggers the native Teams app on desktop/mobile
  window.open(TEAMS_WEB_URL, '_blank', 'noopener,noreferrer');
}
