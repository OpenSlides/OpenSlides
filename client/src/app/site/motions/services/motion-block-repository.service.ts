import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { MotionBlock } from 'app/shared/models/motions/motion-block';
import { ViewMotionBlock } from '../models/view-motion-block';
import { BaseRepository } from 'app/site/base/base-repository';
import { DataStoreService } from 'app/core/services/data-store.service';
import { CollectionStringModelMapperService } from 'app/core/services/collectionStringModelMapper.service';
import { DataSendService } from 'app/core/services/data-send.service';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { Motion } from 'app/shared/models/motions/motion';
import { ViewMotion } from '../models/view-motion';
import { MotionRepositoryService } from './motion-repository.service';

/**
 * Repository service for motion blocks
 */
@Injectable({
    providedIn: 'root'
})
export class MotionBlockRepositoryService extends BaseRepository<ViewMotionBlock, MotionBlock> {
    /**
     * Constructor for the motion block repository
     *
     * @param DS Data Store
     * @param mapperService Mapping collection strings to classes
     * @param dataSend Send models to the server
     * @param motionRepo Accessing the motion repository
     */
    public constructor(
        DS: DataStoreService,
        mapperService: CollectionStringModelMapperService,
        private dataSend: DataSendService,
        private motionRepo: MotionRepositoryService
    ) {
        super(DS, mapperService, MotionBlock);
    }

    /**
     * Updates a given motion block
     *
     * @param update a partial motion block containing the update data
     * @param viewBlock the motion block to update
     */
    public async update(update: Partial<MotionBlock>, viewBlock: ViewMotionBlock): Promise<void> {
        const updateMotionBlock = new MotionBlock();
        updateMotionBlock.patchValues(viewBlock.motionBlock);
        updateMotionBlock.patchValues(update);
        return await this.dataSend.updateModel(updateMotionBlock);
    }

    /**
     * Deletes a motion block from the server
     *
     * @param newBlock the motion block to delete
     */
    public async delete(newBlock: ViewMotionBlock): Promise<void> {
        return await this.dataSend.deleteModel(newBlock.motionBlock);
    }

    /**
     * Creates a new motion block to the server
     *
     * @param newBlock The new block to create
     * @returns the ID of the created model as promise
     */
    public async create(newBlock: MotionBlock): Promise<Identifiable> {
        return await this.dataSend.createModel(newBlock);
    }

    /**
     * Converts a given motion block into a ViewModel
     *
     * @param block a motion block
     * @returns a new ViewMotionBlock
     */
    protected createViewModel(block: MotionBlock): ViewMotionBlock {
        return new ViewMotionBlock(block);
    }

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
     * Retrieves motion block(s) by name
     * TODO: check if a title is unique for a motionBlock
     * @param title Strign to check for
     */
    public getMotionBlockByTitle(title: string): MotionBlock {
        return this.DS.find(MotionBlock, block => block.title === title);
    }
}
