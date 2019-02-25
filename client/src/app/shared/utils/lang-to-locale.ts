/**
 * Helper function to convert a language indicator (en, de)
 * to a locale indicator (de-DE, en-US)
 *
 * Necessary to correctly format timestamps
 */
export function langToLocale(lang: string): string {
    switch (lang) {
        case 'en': {
            return 'en-GB';
        }
        case 'de': {
            return 'de-DE';
        }
        case 'cz': {
            return 'cs-CZ';
        }
        default: {
            // has YYYY-MM-DD HH:mm:SS
            return 'lt-LT';
        }
    }
}
