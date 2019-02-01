/**
 * A lifecyclehook to be called, after all apps are loaded.
 */
export interface OnAfterAppsLoaded {
    /**
     * The hook to call
     */
    onAfterAppsLoaded(): void;
}
