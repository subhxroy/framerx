/**
 * Briefly pulse the given canvas elements to confirm a batch operation landed
 * (e.g. typing one value into a "Mixed" field applies it to all selected
 * elements). Adds a class that plays a one-shot background/outline flash, then
 * removes it. DURATION.instant-scale — quick enough to read as a confirmation,
 * not an animation. No-op in environments without the DOM nodes mounted.
 */
export function flashElements(ids: string[]) {
  for (const id of ids) {
    const node = document.querySelector(`[data-element-id="${id}"]`)
    if (!node) continue
    node.classList.remove('mv-flash')
    // Force reflow so re-adding the class restarts the animation for a rapid
    // sequence of batch edits.
    void (node as HTMLElement).offsetWidth
    node.classList.add('mv-flash')
    window.setTimeout(() => node.classList.remove('mv-flash'), 260)
  }
}
