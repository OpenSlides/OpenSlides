/**
 * Defines the column order for csv/xlsx export/import of motions.
 */
export const motionImportExportHeaderOrder: string[] = [
    'id',
    'identifier',
    'submitters',
    'title',
    'text',
    'reason',
    'category',
    'tags',
    'recommendation',
    'state',
    'motion_block',
    'origin'
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
export const motionExportOnly: string[] = ['id', 'recommendation', 'state', 'tags'];

/**
 * reorders the exported properties according to motionImportExportHeaderOrder
 *
 * @param propertyList A list of motion properties to be ordered
 */
export function sortMotionPropertyList(propertyList: string[]): string[] {
    return motionImportExportHeaderOrder.filter(property => propertyList.includes(property));
}
