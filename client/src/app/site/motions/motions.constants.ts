/**
 * Central place for constants and enums for motions.
 */

/**
 * Determines the possible file format of a motion export
 */
export enum ExportFileFormat {
    PDF = 1,
    CSV,
    XLSX
}

/**
 * Special id to reference the personal note in a comments list
 */
export const PERSONAL_NOTE_ID = -1;

/**
 * Type declaring which strings are valid options for metainfos to be exported into a pdf
 */
export type InfoToExport =
    | 'submitters'
    | 'supporters'
    | 'state'
    | 'recommendation'
    | 'category'
    | 'motion_block'
    | 'origin'
    | 'tags'
    | 'polls'
    | 'speakers'
    | 'id'
    | 'allcomments';

/**
 * The line numbering mode for the motion detail view.
 * The constants need to be in sync with the values saved in the config store.
 */
export enum LineNumberingMode {
    None = 'none',
    Inside = 'inline',
    Outside = 'outside'
}

/**
 * The change recommendation mode for the motion detail view.
 */
export enum ChangeRecoMode {
    Original = 'original',
    Changed = 'changed',
    Diff = 'diff',
    Final = 'agreed',
    ModifiedFinal = 'modified_final_version'
}

export enum AmendmentType {
    Amendment = 1,
    Parent,
    Lead
}

export const verboseChangeRecoMode = {
    original: 'Original version',
    changed: 'Changed version',
    diff: 'Diff version',
    agreed: 'Final version',
    modified_final_version: 'Final print template'
};

/**
 * Enum to define different types of notifications.
 */
export enum MotionEditNotificationType {
    /**
     * Type to declare editing a motion.
     */
    TYPE_BEGIN_EDITING_MOTION = 'typeBeginEditingMotion',

    /**
     * Type if the edit-view is closing.
     */
    TYPE_CLOSING_EDITING_MOTION = 'typeClosingEditingMotion',

    /**
     * Type if changes are saved.
     */
    TYPE_SAVING_EDITING_MOTION = 'typeSavingEditingMotion',

    /**
     * Type to declare if another person is also editing the same motion.
     */
    TYPE_ALSO_EDITING_MOTION = 'typeAlsoEditingMotion'
}

// import-export order specific constants
/**
 * Defines the column order for csv/xlsx export/import of motions.
 */
export const motionImportExportHeaderOrder: string[] = [
    'identifier',
    'submitters',
    'supporters',
    'title',
    'text',
    'reason',
    'category',
    'tags',
    'motion_block',
    'origin',
    'recommendation',
    'state',
    'id'
];

/**
 * hints the metaData. This data will be excluded from the meta-data list in the export dialog.
 * Order of this does not matter
 */
export const noMetaData: string[] = ['identifier', 'title', 'text', 'reason'];

/**
 * Subset of {@link motionImportExportHeaderOrder} properties that are
 * restricted to export only due to database or workflow limitations
 */
export const motionExportOnly: string[] = ['id', 'recommendation', 'state'];

/**
 * reorders the exported properties according to motionImportExportHeaderOrder
 *
 * @param propertyList A list of motion properties to be ordered
 */
export function sortMotionPropertyList(propertyList: string[]): string[] {
    return motionImportExportHeaderOrder.filter(property => propertyList.includes(property));
}
