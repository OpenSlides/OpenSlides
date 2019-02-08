import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { DataSendService } from 'app/core/core-services/data-send.service';
import { User } from 'app/shared/models/users/user';
import { Category } from 'app/shared/models/motions/category';
import { Workflow } from 'app/shared/models/motions/workflow';
import { BaseRepository } from '../base-repository';
import { DataStoreService } from 'app/core/core-services/data-store.service';
import { MotionChangeRecommendation } from 'app/shared/models/motions/motion-change-reco';
import { ViewMotionChangeRecommendation } from 'app/site/motions/models/view-change-recommendation';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { CollectionStringMapperService } from 'app/core/core-services/collectionStringMapper.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';

/**
 * Repository Services for change recommendations
 *
 * The repository is meant to process domain objects (those found under
 * shared/models), so components can display them and interact with them.
 *
 * Rather than manipulating models directly, the repository is meant to
 * inform the {@link DataSendService} about changes which will send
 * them to the Server.
 */
@Injectable({
    providedIn: 'root'
})
export class ChangeRecommendationRepositoryService extends BaseRepository<
    ViewMotionChangeRecommendation,
    MotionChangeRecommendation
> {
    /**
     * Creates a MotionRepository
     *
     * Converts existing and incoming motions to ViewMotions
     * Handles CRUD using an observer to the DataStore
     *
     * @param DS The DataStore
     * @param mapperService Maps collection strings to classes
     * @param dataSend sending changed objects
     */
    public constructor(
        DS: DataStoreService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        private dataSend: DataSendService
    ) {
        super(DS, mapperService, viewModelStoreService, MotionChangeRecommendation, [Category, User, Workflow]);
    }

    /**
     * Creates a change recommendation
     * Creates a (real) change recommendation and delegates it to the {@link DataSendService}
     *
     * @param {MotionChangeRecommendation} changeReco
     */
    public async create(changeReco: MotionChangeRecommendation): Promise<Identifiable> {
        return await this.dataSend.createModel(changeReco);
    }

    /**
     * Given a change recommendation view object, a entry in the backend is created.
     * @param view
     * @returns The id of the created change recommendation
     */
    public async createByViewModel(view: ViewMotionChangeRecommendation): Promise<Identifiable> {
        return await this.dataSend.createModel(view.changeRecommendation);
    }

    /**
     * Creates this view wrapper based on an actual Change Recommendation model
     *
     * @param {MotionChangeRecommendation} model
     */
    protected createViewModel(model: MotionChangeRecommendation): ViewMotionChangeRecommendation {
        return new ViewMotionChangeRecommendation(model);
    }

    /**
     * Deleting a change recommendation.
     *
     * Extract the change recommendation out of the viewModel and delegate
     * to {@link DataSendService}
     * @param {ViewMotionChangeRecommendation} viewModel
     */
    public async delete(viewModel: ViewMotionChangeRecommendation): Promise<void> {
        await this.dataSend.deleteModel(viewModel.changeRecommendation);
    }

    /**
     * updates a change recommendation
     *
     * Updates a (real) change recommendation with patched data and delegate it
     * to the {@link DataSendService}
     *
     * @param {Partial<MotionChangeRecommendation>} update the form data containing the update values
     * @param {ViewMotionChangeRecommendation} viewModel The View Change Recommendation. If not present, a new motion will be created
     */
    public async update(
        update: Partial<MotionChangeRecommendation>,
        viewModel: ViewMotionChangeRecommendation
    ): Promise<void> {
        const changeReco = viewModel.changeRecommendation;
        changeReco.patchValues(update);
        await this.dataSend.partialUpdateModel(changeReco);
    }

    /**
     * return the Observable of all change recommendations belonging to the given motion
     */
    public getChangeRecosOfMotionObservable(motion_id: number): Observable<ViewMotionChangeRecommendation[]> {
        return this.viewModelListSubject.asObservable().pipe(
            map((recos: ViewMotionChangeRecommendation[]) => {
                return recos.filter(reco => reco.motion_id === motion_id);
            })
        );
    }

    /**
     * Synchronously getting the change recommendations of the corresponding motion.
     *
     * @param motionId the id of the target motion
     * @returns the array of change recommendations to the motions.
     */
    public getChangeRecoOfMotion(motion_id: number): ViewMotionChangeRecommendation[] {
        return this.getViewModelList().filter(reco => reco.motion_id === motion_id);
    }

    /**
     * Sets a change recommendation to accepted.
     *
     * @param {ViewMotionChangeRecommendation} change
     */
    public async setAccepted(change: ViewMotionChangeRecommendation): Promise<void> {
        const changeReco = change.changeRecommendation;
        changeReco.patchValues({
            rejected: false
        });
        await this.dataSend.partialUpdateModel(changeReco);
    }

    /**
     * Sets a change recommendation to rejected.
     *
     * @param {ViewMotionChangeRecommendation} change
     */
    public async setRejected(change: ViewMotionChangeRecommendation): Promise<void> {
        const changeReco = change.changeRecommendation;
        changeReco.patchValues({
            rejected: true
        });
        await this.dataSend.partialUpdateModel(changeReco);
    }

    /**
     * Sets if a change recommendation is internal (for the administrators) or not.
     *
     * @param {ViewMotionChangeRecommendation} change
     * @param {boolean} internal
     */
    public async setInternal(change: ViewMotionChangeRecommendation, internal: boolean): Promise<void> {
        const changeReco = change.changeRecommendation;
        changeReco.patchValues({
            internal: internal
        });
        await this.dataSend.partialUpdateModel(changeReco);
    }
}
