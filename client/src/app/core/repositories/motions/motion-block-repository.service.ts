import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

import { CollectionStringMapperService } from 'app/core/core-services/collection-string-mapper.service';
import { DataSendService } from 'app/core/core-services/data-send.service';
import { DataStoreService } from 'app/core/core-services/data-store.service';
import { HttpService } from 'app/core/core-services/http.service';
import { Motion } from 'app/shared/models/motions/motion';
import { MotionBlock } from 'app/shared/models/motions/motion-block';
import { MotionRepositoryService } from './motion-repository.service';
import { ViewMotion } from 'app/site/motions/models/view-motion';
import { ViewMotionBlock, MotionBlockTitleInformation } from 'app/site/motions/models/view-motion-block';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { BaseIsAgendaItemAndListOfSpeakersContentObjectRepository } from '../base-is-agenda-item-and-list-of-speakers-content-object-repository';

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
        private motionRepo: MotionRepositoryService,
        private httpService: HttpService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, translate, MotionBlock);
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
     * Filter the DataStore by Motions and returns the
     *
     * @param block the motion block
     * @returns the number of motions inside a motion block
     */
    public getMotionAmountByBlock(block: MotionBlock): number {
        return this.DS.filter(Motion, motion => motion.motion_block_id === block.id).length;
    }

    /**
     * Observe the motion repository and return the motions belonging to the given
     * block as observable
     *
     * @param block a motion block
     * @returns an observable to view motions
     */
    public getViewMotionsByBlock(block: MotionBlock): Observable<ViewMotion[]> {
        return this.motionRepo
            .getViewModelListObservable()
            .pipe(map(viewMotions => viewMotions.filter(viewMotion => viewMotion.motion_block_id === block.id)));
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
