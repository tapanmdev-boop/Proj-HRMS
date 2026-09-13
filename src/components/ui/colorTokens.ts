// Single source of truth for semantic colors used by Button, Badge, Alert,
// and Toast. Previously each of those components hardcoded its own
// independent bg-{color}-NNN map, which is how the app ended up with a dozen
// slightly different "danger red" / "success green" shades scattered around.
// Change a brand color here and Button/Badge/Alert/Toast all pick it up.

export type SemanticColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

interface ColorToken {
  /** Solid background + white text — primary CTA buttons, Toast background. */
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
    solid: 'bg-brand-600 text-white',
    solidHover: 'hover:bg-brand-700',
    soft: 'bg-brand-100 text-brand-800',
    alert: 'bg-brand-50 border-brand-400 text-brand-800',
    ghostText: 'text-brand-600',
    ghostHover: 'hover:bg-brand-50 hover:text-brand-700',
    ring: 'focus-visible:ring-brand-500',
  },
  secondary: {
    solid: 'bg-gray-600 text-white',
    solidHover: 'hover:bg-gray-700',
    soft: 'bg-gray-100 text-gray-800',
    alert: 'bg-gray-50 border-gray-400 text-gray-800',
    ghostText: 'text-gray-600',
    ghostHover: 'hover:bg-gray-50 hover:text-gray-800',
    ring: 'focus-visible:ring-gray-500',
  },
  success: {
    solid: 'bg-success-600 text-white',
    solidHover: 'hover:bg-success-700',
    soft: 'bg-success-100 text-success-800',
    alert: 'bg-success-50 border-success-500 text-success-800',
    ghostText: 'text-success-600',
    ghostHover: 'hover:bg-success-50 hover:text-success-700',
    ring: 'focus-visible:ring-success-500',
  },
  danger: {
    solid: 'bg-danger-600 text-white',
    solidHover: 'hover:bg-danger-700',
    soft: 'bg-danger-100 text-danger-800',
    alert: 'bg-danger-50 border-danger-500 text-danger-800',
    ghostText: 'text-danger-600',
    ghostHover: 'hover:bg-danger-50 hover:text-danger-700',
    ring: 'focus-visible:ring-danger-500',
  },
  warning: {
    solid: 'bg-warning-500 text-white',
    solidHover: 'hover:bg-warning-600',
    soft: 'bg-warning-100 text-warning-800',
    alert: 'bg-warning-50 border-warning-500 text-warning-800',
    ghostText: 'text-warning-700',
    ghostHover: 'hover:bg-warning-50 hover:text-warning-800',
    ring: 'focus-visible:ring-warning-500',
  },
  info: {
    solid: 'bg-info-600 text-white',
    solidHover: 'hover:bg-info-700',
    soft: 'bg-info-100 text-info-800',
    alert: 'bg-info-50 border-info-500 text-info-800',
    ghostText: 'text-info-600',
    ghostHover: 'hover:bg-info-50 hover:text-info-700',
    ring: 'focus-visible:ring-info-500',
  },
};
