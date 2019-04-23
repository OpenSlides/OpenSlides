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
    public mediafile: FileMetadata;
    public media_url_prefix: string;
    public uploader_id: number;
    public filesize: string;
    public hidden: boolean;
    public timestamp: string;

    public constructor(input?: any) {
        super(Mediafile.COLLECTIONSTRING, input);
    }

    /**
     * Determine the downloadURL
     *
     * @returns the download URL for the specific file as string
     */
    public get downloadUrl(): string {
        return `${this.media_url_prefix}${this.mediafile.name}`;
    }
}
