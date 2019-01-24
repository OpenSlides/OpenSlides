import { BaseViewModel } from '../../base/base-view-model';
import { Mediafile } from '../../../shared/models/mediafiles/mediafile';
import { User } from '../../../shared/models/users/user';

export class ViewMediafile extends BaseViewModel {
    private _mediafile: Mediafile;
    private _uploader: User;

    public get id(): number {
        return this._mediafile ? this._mediafile.id : null;
    }

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

    public get hidden(): boolean {
        return this.mediafile ? this.mediafile.hidden : null;
    }

    public get fileName(): string {
        return this.mediafile && this.mediafile.mediafile ? this.mediafile.mediafile.name : null;
    }

    public get downloadUrl(): string {
        return this.mediafile ? this.mediafile.getDownloadUrl() : null;
    }

    public constructor(mediafile?: Mediafile, uploader?: User) {
        super();
        this._mediafile = mediafile;
        this._uploader = uploader;
    }

    public getTitle(): string {
        return this.title;
    }

    /**
     * Determine if the file is an image
     *
     * @returns true or false
     */
    public isImage(): boolean {
        return ['image/png', 'image/jpeg', 'image/gif'].includes(this.type);
    }

    /**
     * Determine if the file is a font
     *
     * @returns true or false
     */
    public isFont(): boolean {
        return ['font/ttf', 'font/woff'].includes(this.type);
    }

    /**
     * Determine if the file is a pdf
     *
     * @returns true or false
     */
    public isPdf(): boolean {
        return ['application/pdf'].includes(this.type);
    }

    /**
     * Determine if the file is a video
     *
     * @returns true or false
     */
    public isVideo(): boolean {
        return [
            'video/quicktime',
            'video/mp4',
            'video/webm',
            'video/ogg',
            'video/x-flv',
            'application/x-mpegURL',
            'video/MP2T',
            'video/3gpp',
            'video/x-msvideo',
            'video/x-ms-wmv',
            'video/x-matroska'
        ].includes(this.type);
    }

    /**
     * Determine if the file is presentable
     *
     * @returns true or false
     */
    public isPresentable(): boolean {
        return this.isPdf() || this.isImage() || this.isVideo();
    }

    public updateValues(update: Mediafile): void {
        if (update instanceof Mediafile && this.mediafile.id === update.id) {
            this._mediafile = update;
        } else if (update instanceof User && this.uploader.id === update.id) {
            this._uploader = update;
        }
    }

    public is_hidden(): boolean {
        return this._mediafile.hidden;
    }
}
