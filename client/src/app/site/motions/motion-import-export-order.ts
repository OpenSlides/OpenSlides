/**
 * Defines the column order for csv/xlsx export/import of motions.
 */
export const motionImportExportHeaderOrder: string[] = [
    'id',
    'identifier',
    'title',
    'text',
    'reason',
    'submitters',
    'category',
    'origin',
    'motion_block',
    'tags',
    'recommendation',
    'state'
];

/**
 * Subset of {@link motionImportExportHeaderOrder} properties that are
 * restricted to export only due to database or workflow limitations
 */
export const motionExportOnly: string[] = ['id', 'recommendation', 'state', 'tags'];
