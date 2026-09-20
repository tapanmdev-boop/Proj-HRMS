// Single source of truth for semantic colors used by Button, Badge, Alert,
// and Toast. Previously each of those components hardcoded its own
// independent bg-{color}-NNN map, which is how the app ended up with a dozen
// slightly different "danger red" / "success green" shades scattered around.
// Change a brand color here and Button/Badge/Alert/Toast all pick it up.
//
// Palette: Ink & Champagne (see tailwind.config.js). Primary actions are ink,
// champagne gold is reserved for the single most important accent.

export type SemanticColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

interface ColorToken {
  /** Solid background + light text — primary CTA buttons, Toast background. */
  solid: string;
  solidHover: string;
  /** Light background + dark text — Badge pills. */
  soft: string;
  /** Pale background + left border + dark text — Alert banners. */
  alert: string;
  /** Text-only "ghost" buttons — row actions like Edit/Delete/Preview. */
  ghostText: string;
  ghostHover: string;
  /** Focus ring color for keyboard accessibility. */
  ring: string;
}

export const semanticColors: Record<SemanticColor, ColorToken> = {
  primary: {
    solid: 'bg-ink-900 text-ivory-50',
    solidHover: 'hover:bg-ink-800',
    soft: 'bg-gold-100 text-gold-800 ring-1 ring-inset ring-gold-200',
    alert: 'bg-white border-gold-500 text-ink-900',
    ghostText: 'text-ink-900',
    ghostHover: 'hover:bg-ivory-200',
    ring: 'focus-visible:ring-gold-400',
  },
  secondary: {
    solid: 'bg-white text-ink-900 ring-1 ring-inset ring-ivory-300',
    solidHover: 'hover:bg-ivory-50 hover:ring-gray-300',
    soft: 'bg-ivory-200 text-gray-700 ring-1 ring-inset ring-ivory-300',
    alert: 'bg-white border-gray-400 text-gray-800',
    ghostText: 'text-gray-600',
    ghostHover: 'hover:bg-ivory-200 hover:text-ink-900',
    ring: 'focus-visible:ring-gold-400',
  },
  success: {
    solid: 'bg-success-600 text-white',
    solidHover: 'hover:bg-success-700',
    soft: 'bg-success-50 text-success-700 ring-1 ring-inset ring-success-200',
    alert: 'bg-white border-success-500 text-gray-800',
    ghostText: 'text-success-600',
    ghostHover: 'hover:bg-success-50 hover:text-success-700',
    ring: 'focus-visible:ring-success-500',
  },
  danger: {
    solid: 'bg-danger-600 text-white',
    solidHover: 'hover:bg-danger-700',
    soft: 'bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-200',
    alert: 'bg-white border-danger-500 text-gray-800',
    ghostText: 'text-danger-600',
    ghostHover: 'hover:bg-danger-50 hover:text-danger-700',
    ring: 'focus-visible:ring-danger-500',
  },
  warning: {
    solid: 'bg-warning-500 text-white',
    solidHover: 'hover:bg-warning-600',
    soft: 'bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-200',
    alert: 'bg-white border-warning-500 text-gray-800',
    ghostText: 'text-warning-700',
    ghostHover: 'hover:bg-warning-50 hover:text-warning-800',
    ring: 'focus-visible:ring-warning-500',
  },
  info: {
    solid: 'bg-info-600 text-white',
    solidHover: 'hover:bg-info-700',
    soft: 'bg-info-50 text-info-700 ring-1 ring-inset ring-info-200',
    alert: 'bg-white border-info-500 text-gray-800',
    ghostText: 'text-info-600',
    ghostHover: 'hover:bg-info-50 hover:text-info-700',
    ring: 'focus-visible:ring-info-500',
  },
};
