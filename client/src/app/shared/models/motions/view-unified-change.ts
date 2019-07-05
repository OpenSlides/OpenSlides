export enum ViewUnifiedChangeType {
    TYPE_CHANGE_RECOMMENDATION,
    TYPE_AMENDMENT
}

/**
 * A common interface for (paragraph-based) amendments and change recommendations.
 * Needed to merge both types of change objects in the motion content at the same time
 */
export interface ViewUnifiedChange {
    /**
     * Returns the type of change
     */
    getChangeType(): ViewUnifiedChangeType;

    /**
     * If this is a title-related change (only implemented for change recommendations)
     */
    isTitleChange(): boolean;

    /**
     * An id that is unique considering both change recommendations and amendments, therefore needs to be
     * "namespaced" (e.g. "amendment.23" or "recommendation.42")
     */
    getChangeId(): string;

    /**
     * First line number of the change
     */
    getLineFrom(): number;

    /**
     * Last line number of the change (the line number marking the end of the change - not the number of the last line)
     */
    getLineTo(): number;

    /**
     * Returns the new version of the text, as it would be if this change was to be adopted.
     */
    getChangeNewText(): string;

    /**
     * True, if accepted. False, if rejected or undecided.
     */
    isAccepted(): boolean;

    /**
     * True, if rejected. False, if accepted or undecided.
     */
    isRejected(): boolean;

    /**
     * If this object is to be shown in the Diff view.
     */
    showInDiffView(): boolean;

    /**
     * If this object is to be shown in the Diff view.
     */
    showInDiffView(): boolean;

    /**
     * If this object is to be shown in the Final view.
     */
    showInFinalView(): boolean;
}
