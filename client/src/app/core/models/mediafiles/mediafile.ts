import { BaseModel } from 'app/core/models/baseModel';

export class Mediafile extends BaseModel {
    static collectionString = 'mediafiles/mediafile';
    id: number;
    filesize: string;
    hidden: boolean;
    media_url_prefix: string;
    mediafile: Object;
    timestamp: string;
    title: string;
    uploader_id: number;

    constructor(
        id: number,
        filesize?: string,
        hidden?: boolean,
        media_url_prefix?: string,
        mediafile?: Object,
        timestamp?: string,
        title?: string,
        uploader_id?: number
    ) {
        super(id);
        this.filesize = filesize;
        this.hidden = hidden;
        this.media_url_prefix = media_url_prefix;
        this.mediafile = mediafile;
        this.timestamp = timestamp;
        this.title = title;
        this.uploader_id = uploader_id;
    }

    public getCollectionString(): string {
        return Mediafile.collectionString;
    }
}
