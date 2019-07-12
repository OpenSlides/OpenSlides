/**
 * This function converts german umlauts back.
 *
 * @param text
 *
 * @returns {string} The whole text with german umlauts.
 */
export function reconvertChars(text: string): string {
    return text
        .replace(/&auml;|&#228;/g, 'ä')
        .replace(/&Auml;|&#196;/g, 'Ä')
        .replace(/&ouml;|&#246;/g, 'ö')
        .replace(/&Ouml;|&#214;/g, 'Ö')
        .replace(/&uuml;/g, 'ü')
        .replace(/&Uuml;/g, 'Ü')
        .replace(/&aring;|&#229;/g, 'å')
        .replace(/&Aring;|&#197;/g, 'Å')
        .replace(/&szlig;|&#223;/g, 'ß');
}
