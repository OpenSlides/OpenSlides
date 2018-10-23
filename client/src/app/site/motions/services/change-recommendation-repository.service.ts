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
import { HTTPMethod } from 'app/core/services/http.service';

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
    public create(changeReco: MotionChangeReco): Observable<MotionChangeReco> {
        return this.dataSend.createModel(changeReco) as Observable<MotionChangeReco>;
    }

    /**
     * Given a change recommendation view object, a entry in the backend is created and the new
     * change recommendation view object is returned (as an observable).
     *
     * @param {ViewChangeReco} view
     */
    public createByViewModel(view: ViewChangeReco): Observable<ViewChangeReco> {
        return this.create(view.changeRecommendation).pipe(
            map((changeReco: MotionChangeReco) => {
                return new ViewChangeReco(changeReco);
            })
        );
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
    public delete(viewModel: ViewChangeReco): Observable<MotionChangeReco> {
        return this.dataSend.deleteModel(viewModel.changeRecommendation) as Observable<MotionChangeReco>;
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
    public update(update: Partial<MotionChangeReco>, viewModel: ViewChangeReco): Observable<MotionChangeReco> {
        const changeReco = viewModel.changeRecommendation;
        changeReco.patchValues(update);
        return this.dataSend.updateModel(changeReco, HTTPMethod.PATCH) as Observable<MotionChangeReco>;
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
    public setAccepted(change: ViewChangeReco): Observable<MotionChangeReco> {
        const changeReco = change.changeRecommendation;
        changeReco.patchValues({
            rejected: false
        });
        return this.dataSend.updateModel(changeReco, HTTPMethod.PATCH) as Observable<MotionChangeReco>;
    }

    /**
     * Sets a change recommendation to rejected.
     *
     * @param {ViewChangeReco} change
     */
    public setRejected(change: ViewChangeReco): Observable<MotionChangeReco> {
        const changeReco = change.changeRecommendation;
        changeReco.patchValues({
            rejected: true
        });
        return this.dataSend.updateModel(changeReco, HTTPMethod.PATCH) as Observable<MotionChangeReco>;
    }
}
