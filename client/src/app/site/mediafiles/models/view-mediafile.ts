import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { Mediafile, MediafileWithoutNestedModels } from 'app/shared/models/mediafiles/mediafile';
import { BaseViewModelWithListOfSpeakers } from 'app/site/base/base-view-model-with-list-of-speakers';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { Searchable } from 'app/site/base/searchable';
import { ViewGroup } from 'app/site/users/models/view-group';

export const IMAGE_MIMETYPES = ['image/png', 'image/jpeg', 'image/gif'];
export const FONT_MIMETYPES = ['font/ttf', 'font/woff', 'application/font-woff', 'application/font-sfnt'];
export const PDF_MIMETYPES = ['application/pdf'];
export const VIDEO_MIMETYPES = [
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
];

export interface MediafileTitleInformation {
    title: string;
}

export class ViewMediafile extends BaseViewModelWithListOfSpeakers<Mediafile>
    implements MediafileTitleInformation, Searchable {
    public static COLLECTIONSTRING = Mediafile.COLLECTIONSTRING;
    protected _collectionString = Mediafile.COLLECTIONSTRING;

    public get mediafile(): Mediafile {
        return this._model;
    }

    public get filename(): string {
        return this.title;
    }

    public get pages(): number | null {
        return this.mediafile.pdf_information.pages || null;
    }

    public get timestamp(): string {
        return this.mediafile.create_timestamp ? this.mediafile.create_timestamp : null;
    }

    public formatForSearch(): SearchRepresentation {
        const type = this.is_directory ? 'directory' : this.mimetype;
        const properties = [
            { key: 'Title', value: this.getTitle() },
            { key: 'Path', value: this.path },
            { key: 'Type', value: type },
            { key: 'Timestamp', value: this.timestamp },
            { key: 'Size', value: this.filesize ? this.filesize : '0' }
        ];
        return {
            properties,
            searchValue: properties.map(property => property.value),
            type: type
        };
    }

    public get url(): string {
        return this.mediafile.url;
    }

    public getDetailStateURL(): string {
        return this.is_directory ? ('/mediafiles/files/' + this.path).slice(0, -1) : this.url;
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
        return IMAGE_MIMETYPES.includes(this.mimetype);
    }

    /**
     * Determine if the file is a font
     *
     * @returns true or false
     */
    public isFont(): boolean {
        return FONT_MIMETYPES.includes(this.mimetype);
    }

    /**
     * Determine if the file is a pdf
     *
     * @returns true or false
     */
    public isPdf(): boolean {
        return PDF_MIMETYPES.includes(this.mimetype);
    }

    /**
     * Determine if the file is a video
     *
     * @returns true or false
     */
    public isVideo(): boolean {
        return VIDEO_MIMETYPES.includes(this.mimetype);
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
interface IMediafileRelations {
    parent?: ViewMediafile;
    access_groups?: ViewGroup[];
    inherited_access_groups?: ViewGroup[];
}
export interface ViewMediafile extends MediafileWithoutNestedModels, IMediafileRelations {}
