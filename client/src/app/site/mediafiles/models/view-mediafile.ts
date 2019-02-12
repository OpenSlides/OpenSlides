import { BaseViewModel } from '../../base/base-view-model';
import { Mediafile } from 'app/shared/models/mediafiles/mediafile';
import { Searchable } from 'app/site/base/searchable';
import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { ViewUser } from 'app/site/users/models/view-user';

export class ViewMediafile extends BaseViewModel implements Searchable {
    public static COLLECTIONSTRING = Mediafile.COLLECTIONSTRING;

    private _mediafile: Mediafile;
    private _uploader: ViewUser;

    public get mediafile(): Mediafile {
        return this._mediafile;
    }

    public get uploader(): ViewUser {
        return this._uploader;
    }

    public get id(): number {
        return this.mediafile.id;
    }

    public get uploader_id(): number {
        return this.mediafile.uploader_id;
    }

    public get title(): string {
        return this.mediafile.title;
    }

    public get size(): string {
        return this.mediafile.filesize;
    }

    public get type(): string {
        return this.mediafile.mediafile.type;
    }

    public get prefix(): string {
        return this.mediafile.media_url_prefix;
    }

    public get hidden(): boolean {
        return this.mediafile.hidden;
    }

    public get fileName(): string {
        return this.mediafile.mediafile.name;
    }

    public get downloadUrl(): string {
        return this.mediafile.downloadUrl;
    }

    /**
     * Determines if the file has the 'hidden' attribute
     * @returns the hidden attribute, also 'hidden' if there is no file
     * TODO Which is the expected behavior for 'no file'?
     */
    public get is_hidden(): boolean {
        return this.mediafile.hidden;
    }

    /**
     * This is set by the repository
     */
    public getVerboseName;

    public constructor(mediafile: Mediafile, uploader?: ViewUser) {
        super(Mediafile.COLLECTIONSTRING);
        this._mediafile = mediafile;
        this._uploader = uploader;
    }

    public getTitle = () => {
        return this.title;
    };

    public formatForSearch(): SearchRepresentation {
        return [this.title];
    }

    public getDetailStateURL(): string {
        throw new Error('TODO');
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

    public updateDependencies(update: BaseViewModel): void {
        if (update instanceof ViewUser && this.uploader_id === update.id) {
            this._uploader = update;
        }
    }
}
