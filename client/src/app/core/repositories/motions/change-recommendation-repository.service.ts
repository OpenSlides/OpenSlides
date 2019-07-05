import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

import { DataSendService } from 'app/core/core-services/data-send.service';
import { User } from 'app/shared/models/users/user';
import { Category } from 'app/shared/models/motions/category';
import { Workflow } from 'app/shared/models/motions/workflow';
import { BaseRepository } from '../base-repository';
import { DataStoreService } from 'app/core/core-services/data-store.service';
import { MotionChangeRecommendation } from 'app/shared/models/motions/motion-change-reco';
import {
    ViewMotionChangeRecommendation,
    MotionChangeRecommendationTitleInformation
} from 'app/site/motions/models/view-motion-change-recommendation';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { CollectionStringMapperService } from 'app/core/core-services/collection-string-mapper.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { ChangeRecoMode, ViewMotion } from '../../../site/motions/models/view-motion';
import { ViewUnifiedChange } from '../../../shared/models/motions/view-unified-change';
import { DiffService, LineRange, ModificationType } from '../../ui-services/diff.service';

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
    MotionChangeRecommendation,
    MotionChangeRecommendationTitleInformation
> {
    /**
     * Creates a MotionRepository
     *
     * Converts existing and incoming motions to ViewMotions
     * Handles CRUD using an observer to the DataStore
     *
     * @param {DataStoreService} DS The DataStore
     * @param {DataSendService} dataSend sending changed objects
     * @param {CollectionStringMapperService} mapperService Maps collection strings to classes
     * @param {ViewModelStoreService} viewModelStoreService
     * @param {TranslateService} translate
     * @param {DiffService} diffService
     */
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        private diffService: DiffService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, translate, MotionChangeRecommendation, [
            Category,
            User,
            Workflow
        ]);
    }

    public getTitle = (titleInformation: MotionChangeRecommendationTitleInformation) => {
        return this.getVerboseName();
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Change recommendations' : 'Change recommendation');
    };

    /**
     * Creates this view wrapper based on an actual Change Recommendation model
     *
     * @param {MotionChangeRecommendation} model
     */
    protected createViewModel(model: MotionChangeRecommendation): ViewMotionChangeRecommendation {
        return new ViewMotionChangeRecommendation(model);
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
     * return the Observable of all change recommendations belonging to the given motion
     */
    public getChangeRecosOfMotionObservable(motion_id: number): Observable<ViewMotionChangeRecommendation[]> {
        return this.getViewModelListObservable().pipe(
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

    public getTitleWithChanges = (originalTitle: string, change: ViewUnifiedChange, crMode: ChangeRecoMode): string => {
        if (change) {
            if (crMode === ChangeRecoMode.Changed) {
                return change.getChangeNewText();
            } else if (
                (crMode === ChangeRecoMode.Final || crMode === ChangeRecoMode.ModifiedFinal) &&
                !change.isRejected()
            ) {
                return change.getChangeNewText();
            } else {
                return originalTitle;
            }
        } else {
            return originalTitle;
        }
    };

    public getTitleChangesAsDiff = (originalTitle: string, change: ViewUnifiedChange): string => {
        if (change) {
            return this.diffService.diff(originalTitle, change.getChangeNewText());
        } else {
            return '';
        }
    };

    /**
     * Creates a {@link ViewMotionChangeRecommendation} object based on the motion ID and the given lange range.
     * This object is not saved yet and does not yet have any changed HTML. It's meant to populate the UI form.
     *
     * @param {ViewMotion} motion
     * @param {LineRange} lineRange
     * @param {number} lineLength
     */
    public createChangeRecommendationTemplate(
        motion: ViewMotion,
        lineRange: LineRange,
        lineLength: number
    ): ViewMotionChangeRecommendation {
        const changeReco = new MotionChangeRecommendation();
        changeReco.line_from = lineRange.from;
        changeReco.line_to = lineRange.to;
        changeReco.type = ModificationType.TYPE_REPLACEMENT;
        changeReco.text = this.diffService.extractMotionLineRange(motion.text, lineRange, false, lineLength, null);
        changeReco.rejected = false;
        changeReco.motion_id = motion.id;

        return new ViewMotionChangeRecommendation(changeReco);
    }

    /**
     * Creates a {@link ViewMotionChangeRecommendation} object to change the title, based on the motion ID.
     * This object is not saved yet and does not yet have any changed title. It's meant to populate the UI form.
     *
     * @param {ViewMotion} motion
     * @param {number} lineLength
     */
    public createTitleChangeRecommendationTemplate(
        motion: ViewMotion,
        lineLength: number
    ): ViewMotionChangeRecommendation {
        const changeReco = new MotionChangeRecommendation();
        changeReco.line_from = 0;
        changeReco.line_to = 0;
        changeReco.type = ModificationType.TYPE_REPLACEMENT;
        changeReco.text = motion.title;
        changeReco.rejected = false;
        changeReco.motion_id = motion.id;

        return new ViewMotionChangeRecommendation(changeReco);
    }
}
