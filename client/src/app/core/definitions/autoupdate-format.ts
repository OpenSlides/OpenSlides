export interface AutoupdateFormat {
    /**
     * All changed (and created) items as their full/restricted data grouped by their collection.
     */
    changed: {
        [collectionString: string]: object[];
    };

    /**
     * All deleted items (by id) grouped by their collection.
     */
    deleted: {
        [collectionString: string]: number[];
    };

    /**
     * The lower change id bond for this autoupdate
     */
    from_change_id: number;

    /**
     * The upper change id bound for this autoupdate
     */
    to_change_id: number;

    /**
     * Flag, if this autoupdate contains all data. If so, the DS needs to be resetted.
     */
    all_data: boolean;
}

export function isAutoupdateFormat(obj: any): obj is AutoupdateFormat {
    const format = obj as AutoupdateFormat;
    return (
        obj &&
        typeof obj === 'object' &&
        format.changed !== undefined &&
        format.deleted !== undefined &&
        format.from_change_id !== undefined &&
        format.to_change_id !== undefined &&
        format.all_data !== undefined
    );
}
