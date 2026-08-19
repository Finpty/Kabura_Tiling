/**
 * Responsive alignment primitives.
 *
 * Phones and tablets read the marketing copy as a centred, symmetrical
 * composition; from `lg` up the editorial left-aligned desktop layout returns
 * exactly as it was. Everything here is a `lg:` breakpoint pair so a component
 * that opts in gets both halves at once and the two can never drift apart.
 *
 * Used rather than sprinkling `text-center lg:text-left` by hand so the
 * breakpoint lives in one place: change `lg` here and the whole site follows.
 */

/** Centre text below `lg`, restore the desktop left alignment above it. */
export const centreText = "text-center lg:text-left";

/** Centre a width-constrained block (`max-w-*`) below `lg`. */
export const centreBlock = "mx-auto lg:mx-0";

/** Centre a flex/grid row's main axis below `lg`. */
export const centreRow = "justify-center lg:justify-start";

/** Centre a flex column's cross axis below `lg`. */
export const centreItems = "items-center lg:items-start";

/**
 * The common case: a centred text block that is also horizontally centred.
 * Equivalent to `centreText` + `centreBlock`.
 */
export const centreCopy = `${centreText} ${centreBlock}`;

/**
 * A flex row of buttons or inline items — centred below `lg`, left above it.
 * Pair with `flex-wrap`.
 */
export const centreActions = `${centreRow} ${centreItems}`;
