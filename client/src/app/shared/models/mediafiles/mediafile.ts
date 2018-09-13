import { BaseModel } from '../base.model';
import { File } from './file';
import { User } from '../users/user';

/**
 * Representation of MediaFile. Has the nested property "File"
 * @ignore
 */
export class Mediafile extends BaseModel {
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

    public getUploader(): User {
        return this.DS.get<User>('users/user', this.uploader_id);
    }

    public toString(): string {
        return this.title;
    }
}

BaseModel.registerCollectionElement('amediafiles/mediafile', Mediafile);
