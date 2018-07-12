import { BaseModel } from 'app/core/models/base-model';
import { File } from './file';

/**
 * Representation of MediaFile. Has the nested property "File"
 * @ignore
 */
export class Mediafile extends BaseModel {
    protected _collectionString: string;
    id: number;
    title: string;
    mediafile: File;
    media_url_prefix: string;
    uploader_id: number;
    filesize: string;
    hidden: boolean;
    timestamp: string;

    constructor(
        id?: number,
        title?: string,
        mediafile?: File,
        media_url_prefix?: string,
        uploader_id?: number,
        filesize?: string,
        hidden?: boolean,
        timestamp?: string
    ) {
        super();
        this._collectionString = 'mediafiles/mediafile';
        this.id = id;
        this.title = title;
        this.mediafile = mediafile;
        this.media_url_prefix = media_url_prefix;
        this.uploader_id = uploader_id;
        this.filesize = filesize;
        this.hidden = hidden;
        this.timestamp = timestamp;
    }

    deserialize(input: any): this {
        Object.assign(this, input);
        this.mediafile = new File().deserialize(input.mediafile);
        return this;
    }

    getUploader(): BaseModel | BaseModel[] {
        return this.DS.get('users/user', this.uploader_id);
    }
}
