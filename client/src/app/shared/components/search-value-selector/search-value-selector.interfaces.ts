/**
 * Inteface for the Multi-Value-Selector Component to display and use
 * the given values.
 */
export interface SelectorItem {
    /**
     * translates the displayable part of the function to a String
     */
    toString(): string;
}
