import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { CollectionStringMapperService } from 'app/core/core-services/collection-string-mapper.service';
import { DataSendService } from 'app/core/core-services/data-send.service';
import { DataStoreService } from 'app/core/core-services/data-store.service';
import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { Poster } from 'app/shared/models/posters/poster';
import { PosterTitleInformation, ViewPoster } from 'app/site/posters/models/view-poster';
import { TopicTitleInformation } from 'app/site/topics/models/view-topic';
import { BaseIsListOfSpeakersContentObjectRepository } from '../base-is-list-of-speakers-content-object-repository';

@Injectable({
    providedIn: 'root'
})
export class PosterRepositoryService extends BaseIsListOfSpeakersContentObjectRepository<
    ViewPoster,
    Poster,
    PosterTitleInformation
> {
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        relationManager: RelationManagerService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, translate, relationManager, Poster);
    }

    public getTitle = (titleInformation: PosterTitleInformation) => {
        return titleInformation.title;
    };

    public getListTitle = (titleInformation: TopicTitleInformation) => {
        return this.getTitle(titleInformation);
    };

    public getAgendaListTitle = (titleInformation: TopicTitleInformation) => {
        return { title: this.getListTitle(titleInformation) };
    };

    public getAgendaSlideTitle = (titleInformation: TopicTitleInformation) => {
        return this.getAgendaListTitle(titleInformation).title;
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Posters' : 'Poster');
    };
}
