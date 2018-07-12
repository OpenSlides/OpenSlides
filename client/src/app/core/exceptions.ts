/**
 * custom exception that indicated that a collectionString is invalid.
 */
export class ImproperlyConfiguredError extends Error {
    /**
     * Default Constructor for Errors
     * @param m The Error Message
     */
    constructor(m: string) {
        super(m);
    }
}
