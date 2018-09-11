import { BaseViewModel } from '../../base/base-view-model';
import { Mediafile } from '../../../shared/models/mediafiles/mediafile';
import { User } from '../../../shared/models/users/user';
import { BaseModel } from '../../../shared/models/base/base-model';

export class ViewMediafile extends BaseViewModel {
    private _mediafile: Mediafile;
    private _uploader: User;

    public get mediafile(): Mediafile {
        return this._mediafile;
    }

    public get uploader(): User {
        return this._uploader;
    }

    public get title(): string {
        return this.mediafile ? this.mediafile.title : null;
    }

    public get size(): string {
        return this.mediafile ? this.mediafile.filesize : null;
    }

    public get type(): string {
        return this.mediafile && this.mediafile.mediafile ? this.mediafile.mediafile.type : null;
    }

    public get prefix(): string {
        return this.mediafile ? this.mediafile.media_url_prefix : null;
    }

    public get fileName(): string {
        return this.mediafile && this.mediafile.mediafile ? this.mediafile.mediafile.name : null;
    }

    public get downloadUrl(): string {
        return this.mediafile && this.mediafile.mediafile ? `${this.prefix}${this.fileName}` : null;
    }

    public constructor(mediafile?: Mediafile, uploader?: User) {
        super();
        this._mediafile = mediafile;
        this._uploader = uploader;
    }

    public getTitle(): string {
        return this.title;
    }

    public updateValues(update: BaseModel): void {
        if (update instanceof Mediafile) {
            if (this.mediafile.id === update.id) {
                this._mediafile = update;
            }
        }
    }
}
