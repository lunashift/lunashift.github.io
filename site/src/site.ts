// Single place for links and contact details.

/**
 * Launch switch. The app has been live on the App Store since 14 Oct 2026, so this is `true`
 * and the App Store line is a real link to the listing.
 */
export const APP_IS_LIVE = true
export const APP_STORE_URL = 'https://apps.apple.com/app/id6809570772'

export const site = {
  name: 'Luna Shift',
  contactEmail: 'lunashiftsupport@gmail.com',
  privacyHref: `${import.meta.env.BASE_URL}privacy.html`,
  supportHref: `${import.meta.env.BASE_URL}support.html`,
  termsHref: `${import.meta.env.BASE_URL}terms.html`,
  accessibilityHref: `${import.meta.env.BASE_URL}accessibility.html`,
  /**
   * The App Store line stands in for a download button. While the app is in review there is
   * no listing to link to, so it reads as a plain "coming soon" statement. When `appIsLive`
   * is true it becomes a real link to `appStoreUrl` reading `appStoreLiveNote`.
   */
  appIsLive: APP_IS_LIVE,
  appStoreUrl: APP_STORE_URL,
  appStoreLiveNote: 'Download on the App Store',
  appStoreComingNote: 'Coming to the App Store this week',
} as const

/** Product name with a non-breaking space so it never splits across lines. */
export const BRAND = 'Luna Shift'
