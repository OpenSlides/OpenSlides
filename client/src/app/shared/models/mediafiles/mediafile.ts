import { File } from './file';
import { BaseModel } from '../base/base-model';

/**
 * Representation of MediaFile. Has the nested property "File"
 * @ignore
 */
export class Mediafile extends BaseModel<Mediafile> {
    public id: number;
    public title: string;
    public mediafile: File;
    public media_url_prefix: string;
    public uploader_id: number;
    public filesize: string;
    public hidden: boolean;
    public timestamp: string;

    public constructor(input?: any) {
        super('mediafiles/mediafile', input);
    }

    public deserialize(input: any): void {
        Object.assign(this, input);
        this.mediafile = new File(input.mediafile);
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
