/**
 * One can navigate to the detail page of every object implementing this interface.
 */
export interface DetailNavigable {
    /**
     * Get the url for the detail view, so the user can navigate to it.
     */
    getDetailStateURL(): string;
}
