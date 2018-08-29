import { BaseModel } from '../base.model';
import { File } from './file';

/**
 * Representation of MediaFile. Has the nested property "File"
 * @ignore
 */
export class Mediafile extends BaseModel {
    protected _collectionString: string;
    public id: number;
    public title: string;
    public mediafile: File;
    public media_url_prefix: string;
    public uploader_id: number;
    public filesize: string;
    public hidden: boolean;
    public timestamp: string;

    public constructor(
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

    public deserialize(input: any): this {
        Object.assign(this, input);
        this.mediafile = new File().deserialize(input.mediafile);
        return this;
    }

    public getUploader(): BaseModel | BaseModel[] {
        return this.DS.get('users/user', this.uploader_id);
    }
}

BaseModel.registerCollectionElement('amediafiles/mediafile', Mediafile);
