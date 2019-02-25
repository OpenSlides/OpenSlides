import { stripHtmlTags } from './strip-html-tags';

/**
 * Helper to get a preview string
 *
 * @param input
 * @returns returns the first and last 150 characters of a string; used within
 * tooltips for previews
 */
export function getLongPreview(input: string): string {
    if (!input || !input.length) {
        return '';
    }
    if (input.length < 300) {
        return stripHtmlTags(input);
    }
    return (
        stripHtmlTags(input.substring(0, 147)) +
        ' [...] ' +
        stripHtmlTags(input.substring(input.length - 150, input.length))
    );
}

/**
 * Get the first characters of a string, for preview purposes
 *
 * @param input any string
 * @returns a string with at most 50 characters
 */
export function getShortPreview(input: string): string {
    if (!input || !input.length) {
        return '';
    }
    if (input.length > 50) {
        return stripHtmlTags(input.substring(0, 47)) + '...';
    }
    return stripHtmlTags(input);
}
