import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { CollectionStringMapperService } from 'app/core/core-services/collection-string-mapper.service';
import { DataSendService } from 'app/core/core-services/data-send.service';
import { DataStoreService } from 'app/core/core-services/data-store.service';
import { HttpService } from 'app/core/core-services/http.service';
import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { RelationDefinition } from 'app/core/definitions/relations';
import { MotionBlock } from 'app/shared/models/motions/motion-block';
import { ViewMotion } from 'app/site/motions/models/view-motion';
import { MotionBlockTitleInformation, ViewMotionBlock } from 'app/site/motions/models/view-motion-block';
import { BaseIsAgendaItemAndListOfSpeakersContentObjectRepository } from '../base-is-agenda-item-and-list-of-speakers-content-object-repository';
import { MotionRepositoryService } from './motion-repository.service';

const MotionBlockRelations: RelationDefinition[] = [
    {
        type: 'O2M',
        foreignIdKey: 'motion_block_id',
        ownKey: 'motions',
        foreignViewModel: ViewMotion
    }
];

/**
 * Repository service for motion blocks
 */
@Injectable({
    providedIn: 'root'
})
export class MotionBlockRepositoryService extends BaseIsAgendaItemAndListOfSpeakersContentObjectRepository<
    ViewMotionBlock,
    MotionBlock,
    MotionBlockTitleInformation
> {
    /**
     * Constructor for the motion block repository
     *
     * @param DS Data Store
     * @param mapperService Mapping collection strings to classes
     * @param dataSend Send models to the server
     * @param motionRepo Accessing the motion repository
     * @param httpService Sending a request directly
     */
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        relationManager: RelationManagerService,
        private motionRepo: MotionRepositoryService,
        private httpService: HttpService
    ) {
        super(
            DS,
            dataSend,
            mapperService,
            viewModelStoreService,
            translate,
            relationManager,
            MotionBlock,
            MotionBlockRelations
        );
        this.initSorting();
    }

    public getTitle = (titleInformation: MotionBlockTitleInformation) => {
        return titleInformation.title;
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Motion blocks' : 'Motion block');
    };

    /**
     * Removes the motion block id from the given motion
     *
     * @param viewMotion The motion to alter
     */
    public removeMotionFromBlock(viewMotion: ViewMotion): void {
        const updateMotion = viewMotion.motion;
        updateMotion.motion_block_id = null;
        this.motionRepo.update(updateMotion, viewMotion);
    }

    /**
     * Retrieves motion blocks by name
     *
     * @param title String to check for
     * @returns the motion blocks found
     */
    public getMotionBlocksByTitle(title: string): MotionBlock[] {
        return this.DS.filter(MotionBlock, block => block.title === title);
    }

    /**
     * Signals the acceptance of the current recommendation of this motionBlock
     *
     * @param motionBlock
     */
    public async followRecommendation(motionBlock: ViewMotionBlock): Promise<void> {
        const restPath = `/rest/motions/motion-block/${motionBlock.id}/follow_recommendations/`;
        await this.httpService.post(restPath);
    }

    /**
     * Sets the default sorting (e.g. in dropdowns and for new users) to 'title'
     */
    private initSorting(): void {
        this.setSortFunction((a: ViewMotionBlock, b: ViewMotionBlock) => {
            return this.languageCollator.compare(a.title, b.title);
        });
    }
}
