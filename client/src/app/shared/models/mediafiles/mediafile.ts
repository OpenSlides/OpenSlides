import { File } from './file';
import { ProjectableBaseModel } from '../base/projectable-base-model';
import { Searchable } from '../base/searchable';

/**
 * Representation of MediaFile. Has the nested property "File"
 * @ignore
 */
export class Mediafile extends ProjectableBaseModel implements Searchable {
    public id: number;
    public title: string;
    public mediafile: File;
    public media_url_prefix: string;
    public uploader_id: number;
    public filesize: string;
    public hidden: boolean;
    public timestamp: string;

    public constructor(input?: any) {
        super('mediafiles/mediafile', 'Mediafile', input);
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
    public getDownloadUrl(): string {
        return `${this.media_url_prefix}${this.mediafile.name}`;
    }

    public getTitle(): string {
        return this.title;
    }

    public formatForSearch(): string[] {
        return [this.title, this.mediafile.name];
    }

    public getDetailStateURL(): string {
        return this.getDownloadUrl();
    }
}
