/**
 * Interface for every model, that should be projectable.
 */
export interface Projectable {
    /**
     * Should return the title for the projector.
     */
    getProjectorTitle(): string;

    /**
     * Dummy. I don't know how the projctor system will be, so this function may change
     */
    project(): void;
}
