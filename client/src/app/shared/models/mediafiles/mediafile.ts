import { BaseModelWithListOfSpeakers } from '../base/base-model-with-list-of-speakers';

interface FileMetadata {
    name: string;
    type: string;

    // Only for PDFs
    pages: number;
    encrypted?: boolean;
}

/**
 * Representation of MediaFile. Has the nested property "File"
 * @ignore
 */
export class Mediafile extends BaseModelWithListOfSpeakers<Mediafile> {
    public static COLLECTIONSTRING = 'mediafiles/mediafile';
    public id: number;
    public title: string;
    public mediafile?: FileMetadata;
    public media_url_prefix: string;
    public filesize?: string;
    public access_groups_id: number[];
    public create_timestamp: string;
    public parent_id: number | null;
    public is_directory: boolean;
    public path: string;
    public inherited_access_groups_id: boolean | number[];

    public get has_inherited_access_groups(): boolean {
        return typeof this.inherited_access_groups_id !== 'boolean';
    }

    public constructor(input?: any) {
        super(Mediafile.COLLECTIONSTRING);
        // Do not change null to undefined...
        this.deserialize(input);
    }

    /**
     * Determine the downloadURL
     *
     * @returns the download URL for the specific file as string
     */
    public get url(): string {
        return `${this.media_url_prefix}${this.path}`;
    }
}
