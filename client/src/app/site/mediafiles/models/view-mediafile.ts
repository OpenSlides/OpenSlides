import { BaseViewModel } from '../../base/base-view-model';
import { Mediafile } from 'app/shared/models/mediafiles/mediafile';
import { Searchable } from 'app/site/base/searchable';
import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { ViewUser } from 'app/site/users/models/view-user';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { BaseViewModelWithListOfSpeakers } from 'app/site/base/base-view-model-with-list-of-speakers';
import { ViewListOfSpeakers } from 'app/site/agenda/models/view-list-of-speakers';

export interface MediafileTitleInformation {
    title: string;
}

export class ViewMediafile extends BaseViewModelWithListOfSpeakers<Mediafile>
    implements MediafileTitleInformation, Searchable {
    public static COLLECTIONSTRING = Mediafile.COLLECTIONSTRING;

    private _uploader: ViewUser;

    public get mediafile(): Mediafile {
        return this._model;
    }

    public get uploader(): ViewUser {
        return this._uploader;
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

    public get pages(): number | null {
        return this.mediafile.mediafile.pages;
    }

    /**
     * Determines if the file has the 'hidden' attribute
     * @returns the hidden attribute, also 'hidden' if there is no file
     * TODO Which is the expected behavior for 'no file'?
     */
    public get is_hidden(): boolean {
        return this.mediafile.hidden;
    }

    public constructor(mediafile: Mediafile, listOfSpeakers?: ViewListOfSpeakers, uploader?: ViewUser) {
        super(Mediafile.COLLECTIONSTRING, mediafile, listOfSpeakers);
        this._uploader = uploader;
    }

    public formatForSearch(): SearchRepresentation {
        const searchValues = [this.title];
        if (this.uploader) {
            searchValues.push(this.uploader.full_name);
        }
        return searchValues;
    }

    public getDetailStateURL(): string {
        return this.downloadUrl;
    }

    public getSlide(): ProjectorElementBuildDeskriptor {
        return {
            getBasicProjectorElement: () => ({
                name: Mediafile.COLLECTIONSTRING,
                id: this.id,
                getIdentifiers: () => ['name', 'id']
            }),
            slideOptions: [],
            projectionDefaultName: 'mediafiles',
            getDialogTitle: () => this.getTitle()
        };
    }

    public isProjectable(): boolean {
        return this.isImage() || this.isPdf();
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
        return ['font/ttf', 'font/woff', 'application/font-woff', 'application/font-sfnt'].includes(this.type);
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
        super.updateDependencies(update);
        if (update instanceof ViewUser && this.uploader_id === update.id) {
            this._uploader = update;
        }
    }
}
