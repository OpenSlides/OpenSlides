/**
 * Error for closing promt dialogs. This should be used, if no action should result
 * from closing the dialog, like cancel on a delete prompt.
 */
export class DialogClosedError extends Error {}
