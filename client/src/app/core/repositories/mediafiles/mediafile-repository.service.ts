import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';

import { TranslateService } from '@ngx-translate/core';

import { ViewMediafile, MediafileTitleInformation } from 'app/site/mediafiles/models/view-mediafile';
import { Mediafile } from 'app/shared/models/mediafiles/mediafile';
import { User } from 'app/shared/models/users/user';
import { DataStoreService } from '../../core-services/data-store.service';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { DataSendService } from 'app/core/core-services/data-send.service';
import { HttpService } from 'app/core/core-services/http.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { ViewUser } from 'app/site/users/models/view-user';
import { BaseIsListOfSpeakersContentObjectRepository } from '../base-is-list-of-speakers-content-object-repository';
import { ViewListOfSpeakers } from 'app/site/agenda/models/view-list-of-speakers';

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
        private httpService: HttpService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, translate, Mediafile, [User]);
        this.initSorting();
    }

    public getTitle = (titleInformation: MediafileTitleInformation) => {
        return titleInformation.title;
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Files' : 'File');
    };

    /**
     * Creates mediafile ViewModels out of given mediafile objects
     *
     * @param file mediafile to convert
     * @returns a new mediafile ViewModel
     */
    public createViewModel(file: Mediafile): ViewMediafile {
        const listOfSpeakers = this.viewModelStoreService.get(ViewListOfSpeakers, file.list_of_speakers_id);
        const uploader = this.viewModelStoreService.get(ViewUser, file.uploader_id);
        return new ViewMediafile(file, listOfSpeakers, uploader);
    }

    /**
     * Uploads a file to the server.
     * The HttpHeader should be Application/FormData, the empty header will
     * set the the required boundary automatically
     *
     * @param file created UploadData, containing a file
     * @returns the promise to a new mediafile.
     */
    public async uploadFile(file: FormData): Promise<Identifiable> {
        const emptyHeader = new HttpHeaders();
        return this.httpService.post<Identifiable>('/rest/mediafiles/mediafile/', file, {}, emptyHeader);
    }

    /**
     * Sets the default sorting (e.g. in dropdowns and for new users) to 'title'
     */
    private initSorting(): void {
        this.setSortFunction((a: ViewMediafile, b: ViewMediafile) => {
            return this.languageCollator.compare(a.title, b.title);
        });
    }
}
