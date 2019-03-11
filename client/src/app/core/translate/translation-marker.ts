/**
 * Mark strings as translateable for ng-translate-extract.
 * Marked strings are added into template-en.pot by 'npm run extract'.
 *
 * @example
 * ```ts
 * _('translateable string');
 * ```
 */
export function _(str: string): string {
    return str;
}
