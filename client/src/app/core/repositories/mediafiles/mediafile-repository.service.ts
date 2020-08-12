import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import * as JSZip from 'jszip';
import { BehaviorSubject, Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { DataSendService } from 'app/core/core-services/data-send.service';
import { HttpService } from 'app/core/core-services/http.service';
import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { RelationDefinition } from 'app/core/definitions/relations';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { Mediafile } from 'app/shared/models/mediafiles/mediafile';
import { MediafileTitleInformation, ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';
import { ViewGroup } from 'app/site/users/models/view-group';
import { BaseIsListOfSpeakersContentObjectRepository } from '../base-is-list-of-speakers-content-object-repository';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { DataStoreService } from '../../core-services/data-store.service';

const MediafileRelations: RelationDefinition[] = [
    {
        type: 'M2O',
        ownIdKey: 'parent_id',
        ownKey: 'parent',
        foreignViewModel: ViewMediafile
    },
    {
        type: 'M2M',
        ownIdKey: 'access_groups_id',
        ownKey: 'access_groups',
        foreignViewModel: ViewGroup
    },
    {
        type: 'M2M',
        ownIdKey: 'inherited_access_groups_id',
        ownKey: 'inherited_access_groups',
        foreignViewModel: ViewGroup
    }
];

/**
 * Repository for MediaFiles
 */
@Injectable({
    providedIn: 'root'
})
export class MediafileRepositoryService extends BaseIsListOfSpeakersContentObjectRepository<
    ViewMediafile,
    Mediafile,
    MediafileTitleInformation
> {
    private directoryBehaviorSubject: BehaviorSubject<ViewMediafile[]>;

    /**
     * Constructor for the mediafile repository
     * @param DS Data store
     * @param mapperService OpenSlides class mapping service
     * @param dataSend sending data to the server
     * @param httpService OpenSlides own http service
     */
    public constructor(
        DS: DataStoreService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        dataSend: DataSendService,
        relationManager: RelationManagerService,
        private httpService: HttpService
    ) {
        super(
            DS,
            dataSend,
            mapperService,
            viewModelStoreService,
            translate,
            relationManager,
            Mediafile,
            MediafileRelations
        );
        this.directoryBehaviorSubject = new BehaviorSubject([]);
        this.getViewModelListObservable().subscribe(mediafiles => {
            if (mediafiles) {
                this.directoryBehaviorSubject.next(mediafiles.filter(mediafile => mediafile.is_directory));
            }
        });

        this.viewModelSortFn = (a: ViewMediafile, b: ViewMediafile) => {
            return this.languageCollator.compare(a.title, b.title);
        };
    }

    public getTitle = (titleInformation: MediafileTitleInformation) => {
        return titleInformation.title;
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Files' : 'File');
    };

    public async getDirectoryIdByPath(pathSegments: string[]): Promise<number | null> {
        let parentId = null;

        const mediafiles = await this.unsafeViewModelListSubject.pipe(first(x => !!x)).toPromise();

        pathSegments.forEach(segment => {
            const mediafile = mediafiles.find(m => m.is_directory && m.title === segment && m.parent_id === parentId);
            if (!mediafile) {
                parentId = null;
                return;
            } else {
                parentId = mediafile.id;
            }
        });
        return parentId;
    }

    public getListObservableDirectory(parentId: number | null): Observable<ViewMediafile[]> {
        return this.getViewModelListObservable().pipe(
            map(mediafiles => {
                return mediafiles.filter(mediafile => mediafile.parent_id === parentId);
            })
        );
    }

    /**
     * Uploads a file to the server.
     * The HttpHeader should be Application/FormData, the empty header will
     * set the the required boundary automatically
     *
     * @param file created UploadData, containing a file
     * @returns the promise to a new mediafile.
     */
    public async uploadFile(file: any): Promise<Identifiable> {
        const emptyHeader = new HttpHeaders();
        return this.httpService.post<Identifiable>('/rest/mediafiles/mediafile/', file, {}, emptyHeader);
    }

    public async downloadArchive(archiveName: string, files: ViewMediafile[]): Promise<void> {
        const zip = new JSZip();
        for (const file of files) {
            if (!file.is_directory) {
                const base64Data = await this.httpService.downloadAsBase64(file.url);
                zip.file(file.filename, base64Data, { base64: true });
            }
        }
        const archive = await zip.generateAsync({ type: 'blob' });
        saveAs(archive, archiveName);
    }

    public getDirectoryBehaviorSubject(): BehaviorSubject<ViewMediafile[]> {
        return this.directoryBehaviorSubject;
    }

    public async move(mediafiles: ViewMediafile[], directoryId: number | null): Promise<void> {
        return await this.httpService.post('/rest/mediafiles/mediafile/move/', {
            ids: mediafiles.map(mediafile => mediafile.id),
            directory_id: directoryId
        });
    }

    /**
     * Deletes many files.
     *
     * @param mediafiles The users to delete
     */
    public async bulkDelete(mediafiles: ViewMediafile[]): Promise<void> {
        await this.httpService.post('/rest/mediafiles/mediafile/bulk_delete/', {
            ids: mediafiles.map(mediafile => mediafile.id)
        });
    }
}
