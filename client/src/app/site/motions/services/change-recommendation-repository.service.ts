import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { DataSendService } from '../../../core/services/data-send.service';
import { User } from '../../../shared/models/users/user';
import { Category } from '../../../shared/models/motions/category';
import { Workflow } from '../../../shared/models/motions/workflow';
import { BaseRepository } from '../../base/base-repository';
import { DataStoreService } from '../../../core/services/data-store.service';
import { MotionChangeReco } from '../../../shared/models/motions/motion-change-reco';
import { ViewChangeReco } from '../models/view-change-reco';
import { Identifiable } from '../../../shared/models/base/identifiable';

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
export class ChangeRecommendationRepositoryService extends BaseRepository<ViewChangeReco, MotionChangeReco> {
    /**
     * Creates a MotionRepository
     *
     * Converts existing and incoming motions to ViewMotions
     * Handles CRUD using an observer to the DataStore
     * @param DS
     * @param dataSend
     */
    public constructor(DS: DataStoreService, private dataSend: DataSendService) {
        super(DS, MotionChangeReco, [Category, User, Workflow]);
    }

    /**
     * Creates a change recommendation
     * Creates a (real) change recommendation and delegates it to the {@link DataSendService}
     *
     * @param {MotionChangeReco} changeReco
     */
    public async create(changeReco: MotionChangeReco): Promise<Identifiable> {
        return await this.dataSend.createModel(changeReco);
    }

    /**
     * Given a change recommendation view object, a entry in the backend is created and the new
     * change recommendation view object is returned (as an observable).
     *
     * @param {ViewChangeReco} view
     * @deprecated Will not work with PR #3928. There will just be the id as response to create requests.
     *  Two possibilities: Make a server change to still retrieve the created object or you have to wait for the
     *  correct autoupdate.
     */
    public async createByViewModel(view: ViewChangeReco): Promise<Identifiable> {
        return await this.dataSend.createModel(view.changeRecommendation);
        // return new ViewChangeReco(cr);
    }

    /**
     * Creates this view wrapper based on an actual Change Recommendation model
     *
     * @param {MotionChangeReco} model
     */
    protected createViewModel(model: MotionChangeReco): ViewChangeReco {
        return new ViewChangeReco(model);
    }

    /**
     * Deleting a change recommendation.
     *
     * Extract the change recommendation out of the viewModel and delegate
     * to {@link DataSendService}
     * @param {ViewChangeReco} viewModel
     */
    public async delete(viewModel: ViewChangeReco): Promise<void> {
        await this.dataSend.deleteModel(viewModel.changeRecommendation);
    }

    /**
     * updates a change recommendation
     *
     * Updates a (real) change recommendation with patched data and delegate it
     * to the {@link DataSendService}
     *
     * @param {Partial<MotionChangeReco>} update the form data containing the update values
     * @param {ViewChangeReco} viewModel The View Change Recommendation. If not present, a new motion will be created
     */
    public async update(update: Partial<MotionChangeReco>, viewModel: ViewChangeReco): Promise<void> {
        const changeReco = viewModel.changeRecommendation;
        changeReco.patchValues(update);
        await this.dataSend.partialUpdateModel(changeReco);
    }

    /**
     * return the Observable of all change recommendations belonging to the given motion
     */
    public getChangeRecosOfMotionObservable(motion_id: number): Observable<ViewChangeReco[]> {
        return this.viewModelListSubject.asObservable().pipe(
            map((recos: ViewChangeReco[]) => {
                return recos.filter(reco => reco.motion_id === motion_id);
            })
        );
    }

    /**
     * Sets a change recommendation to accepted.
     *
     * @param {ViewChangeReco} change
     */
    public async setAccepted(change: ViewChangeReco): Promise<void> {
        const changeReco = change.changeRecommendation;
        changeReco.patchValues({
            rejected: false
        });
        await this.dataSend.partialUpdateModel(changeReco);
    }

    /**
     * Sets a change recommendation to rejected.
     *
     * @param {ViewChangeReco} change
     */
    public async setRejected(change: ViewChangeReco): Promise<void> {
        const changeReco = change.changeRecommendation;
        changeReco.patchValues({
            rejected: true
        });
        await this.dataSend.partialUpdateModel(changeReco);
    }

    /**
     * Sets if a change recommendation is internal (for the administrators) or not.
     *
     * @param {ViewChangeReco} change
     * @param {boolean} internal
     */
    public async setInternal(change: ViewChangeReco, internal: boolean): Promise<void> {
        const changeReco = change.changeRecommendation;
        changeReco.patchValues({
            internal: internal
        });
        await this.dataSend.partialUpdateModel(changeReco);
    }
}
