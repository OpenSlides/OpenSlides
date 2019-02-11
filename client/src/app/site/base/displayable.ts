/**
 * Every displayble object should have the given functions to give the object's title.
 */
export interface Displayable {
    /**
     * Should return the title. Always used except for list view, the agenda and in the projector.
     */
    getTitle: () => string;

    /**
     * Should return the title for the list view.
     */
    getListTitle: () => string;
}
