/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║          SHYAM BHOG — IMMUTABLE BRAND CONFIGURATION         ║
 * ║   This file is the single source of truth for brand identity.║
 * ║   Do NOT import dynamic settings for these values.          ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const BRAND = {
  /** Platform display name — shown in Navbar, invoices, footer */
  name: 'Shyam Bhog',

  /** Short tagline shown under the name */
  tagline: 'Sacred Digital Platform',

  /** Full description for about sections */
  description: 'India\'s premier digital platform for devotees of Khatu Shyam Ji. Offering Bhog booking, Arjee, live crowd updates, hotel stays and more.',

  /** Primary accent colour (hex) */
  primaryColor: '#F07924',

  /**
   * Logo — use a public path or an imported asset.
   * Set to null to show the initials fallback instead.
   *
   * To use your logo:
   *   1. Drop the file in client/public/logo.png  →  use '/logo.png'
   *   2. Or import it:  import logo from '../assets/logo.png' and set it here.
   */
  logoPath: '/favicon.svg',   // ← change this to '/logo.png' once you add the file

  /** Initials shown when logoPath is null or fails to load */
  initials: 'SB',

  /** First letter shown in small avatar contexts */
  letterMark: 'S',

  /** Footer copyright */
  copyright: `© ${new Date().getFullYear()} Shyam Bhog. All rights reserved.`,

  /** Social handles (display only) */
  social: {
    instagram: '@shyambhog',
    website:   'shyambhog.onrender.com',
  },
};

export default BRAND;
