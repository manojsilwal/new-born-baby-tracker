import type { FocusEvent } from 'react';

/** Scroll the focused field into the visible area after the mobile keyboard opens. */
export function scrollFocusedFieldIntoView(e: FocusEvent<HTMLElement>): void {
  const el = e.currentTarget;
  window.setTimeout(() => {
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  }, 350);
}
