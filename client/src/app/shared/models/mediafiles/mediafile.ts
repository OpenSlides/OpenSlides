import { BaseModelWithListOfSpeakers } from '../base/base-model-with-list-of-speakers';

interface PdfInformation {
    pages?: number;
    encrypted?: boolean;
}

export interface MediafileWithoutNestedModels extends BaseModelWithListOfSpeakers<Mediafile> {
    id: number;
    title: string;
    media_url_prefix: string;
    pdf_information: PdfInformation;
    filesize?: string;
    mimetype?: string;
    access_groups_id: number[];
    create_timestamp: string;
    parent_id: number | null;
    is_directory: boolean;
    path: string;
    inherited_access_groups_id: boolean | number[];

    has_inherited_access_groups: boolean;
}

/**
 * Representation of MediaFile. Has the nested property "File"
 * @ignore
 */
export class Mediafile extends BaseModelWithListOfSpeakers<Mediafile> {
    public static COLLECTIONSTRING = 'mediafiles/mediafile';
    public id: number;

    public get has_inherited_access_groups(): boolean {
        return typeof this.inherited_access_groups_id !== 'boolean';
    }

    public constructor(input?: any) {
        super(Mediafile.COLLECTIONSTRING, input);
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
export interface Mediafile extends MediafileWithoutNestedModels {}
