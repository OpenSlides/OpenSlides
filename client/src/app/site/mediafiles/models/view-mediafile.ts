import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { Mediafile } from 'app/shared/models/mediafiles/mediafile';
import { BaseViewModelWithListOfSpeakers } from 'app/site/base/base-view-model-with-list-of-speakers';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { Searchable } from 'app/site/base/searchable';
import { ViewGroup } from 'app/site/users/models/view-group';

export const IMAGE_MIMETYPES = ['image/png', 'image/jpeg', 'image/gif'];
export const FONT_MIMETYPES = ['font/ttf', 'font/woff', 'application/font-woff', 'application/font-sfnt'];
export const PDF_MIMETYPES = ['application/pdf'];

export interface MediafileTitleInformation {
    title: string;
}

export class ViewMediafile extends BaseViewModelWithListOfSpeakers<Mediafile>
    implements MediafileTitleInformation, Searchable {
    public static COLLECTIONSTRING = Mediafile.COLLECTIONSTRING;

    private _parent?: ViewMediafile;
    private _access_groups?: ViewGroup[];
    private _inherited_access_groups?: ViewGroup[];

    public get mediafile(): Mediafile {
        return this._model;
    }

    public get parent(): ViewMediafile | null {
        return this._parent;
    }

    public get access_groups(): ViewGroup[] {
        return this._access_groups || [];
    }

    public get access_groups_id(): number[] {
        return this.mediafile.access_groups_id;
    }

    public get inherited_access_groups(): ViewGroup[] | null {
        return this._inherited_access_groups;
    }

    public get inherited_access_groups_id(): boolean | number[] {
        return this.mediafile.inherited_access_groups_id;
    }

    public get has_inherited_access_groups(): boolean {
        return this.mediafile.has_inherited_access_groups;
    }

    public get title(): string {
        return this.mediafile.title;
    }

    public get path(): string {
        return this.mediafile.path;
    }

    public get parent_id(): number {
        return this.mediafile.parent_id;
    }

    public get is_directory(): boolean {
        return this.mediafile.is_directory;
    }

    public get is_file(): boolean {
        return !this.is_directory;
    }

    public get size(): string {
        return this.mediafile.filesize;
    }

    public get prefix(): string {
        return this.mediafile.media_url_prefix;
    }

    public get url(): string {
        return this.mediafile.url;
    }

    public get type(): string {
        return this.mediafile.mediafile ? this.mediafile.mediafile.type : '';
    }

    public get pages(): number | null {
        return this.mediafile.mediafile ? this.mediafile.mediafile.pages : null;
    }

    public get timestamp(): string {
        return this.mediafile.create_timestamp ? this.mediafile.create_timestamp : null;
    }

    public constructor(mediafile: Mediafile) {
        super(Mediafile.COLLECTIONSTRING, mediafile);
    }

    public formatForSearch(): SearchRepresentation {
        return [this.title, this.path];
    }

    public getDetailStateURL(): string {
        return this.url;
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

    public getDirectoryChain(): ViewMediafile[] {
        const parentChain = this.parent ? this.parent.getDirectoryChain() : [];
        parentChain.push(this);
        return parentChain;
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
        return IMAGE_MIMETYPES.includes(this.type);
    }

    /**
     * Determine if the file is a font
     *
     * @returns true or false
     */
    public isFont(): boolean {
        return FONT_MIMETYPES.includes(this.type);
    }

    /**
     * Determine if the file is a pdf
     *
     * @returns true or false
     */
    public isPdf(): boolean {
        return PDF_MIMETYPES.includes(this.type);
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

    public getIcon(): string {
        if (this.is_directory) {
            return 'folder';
        } else if (this.isPdf()) {
            return 'picture_as_pdf';
        } else if (this.isImage()) {
            return 'insert_photo';
        } else if (this.isFont()) {
            return 'text_fields';
        } else if (this.isVideo()) {
            return 'movie';
        } else {
            return 'insert_drive_file';
        }
    }
}
