/**
 * Helper to remove html tags from a string.
 * CAUTION: It is just a basic "don't show distracting html tags in a
 * preview", not an actual tested sanitizer!
 *
 * @param inputString
 */
export function stripHtmlTags(inputString: string): string {
    const regexp = new RegExp(/<[^ ][^<>]*(>|$)/g);
    return inputString.replace(regexp, '').trim();
}
