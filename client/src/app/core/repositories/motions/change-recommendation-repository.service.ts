import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CollectionStringMapperService } from 'app/core/core-services/collection-string-mapper.service';
import { DataSendService } from 'app/core/core-services/data-send.service';
import { DataStoreService } from 'app/core/core-services/data-store.service';
import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { MotionChangeRecommendation } from 'app/shared/models/motions/motion-change-reco';
import {
    MotionChangeRecommendationTitleInformation,
    ViewMotionChangeRecommendation
} from 'app/site/motions/models/view-motion-change-recommendation';
import { ChangeRecoMode } from 'app/site/motions/motions.constants';
import { BaseRepository } from '../base-repository';
import { DiffService, LineRange, ModificationType } from '../../ui-services/diff.service';
import { LinenumberingService } from '../../ui-services/linenumbering.service';
import { ViewMotion } from '../../../site/motions/models/view-motion';
import { ViewUnifiedChange } from '../../../shared/models/motions/view-unified-change';

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
     * @param {RelationManagerService} relationManager
     * @param {DiffService} diffService
     * @param {LinenumberingService} lineNumbering Line numbering service
     */
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        relationManager: RelationManagerService,
        private diffService: DiffService,
        private lineNumbering: LinenumberingService
    ) {
        super(
            DS,
            dataSend,
            mapperService,
            viewModelStoreService,
            translate,
            relationManager,
            MotionChangeRecommendation
        );
    }

    public getTitle = (titleInformation: MotionChangeRecommendationTitleInformation) => {
        return this.getVerboseName();
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Change recommendations' : 'Change recommendation');
    };

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
     * @param motion_id the id of the target motion
     * @returns the array of change recommendations to the motions.
     */
    public getChangeRecoOfMotion(motion_id: number): ViewMotionChangeRecommendation[] {
        return this.getViewModelList().filter(reco => reco.motion_id === motion_id);
    }

    /**
     * Sets a change recommendation to accepted.
     *
     * @param {ViewMotionChangeRecommendation} changeRecommendation
     */
    public async setAccepted(changeRecommendation: ViewMotionChangeRecommendation): Promise<void> {
        await this.patch({ rejected: false }, changeRecommendation);
    }

    /**
     * Sets a change recommendation to rejected.
     *
     * @param {ViewMotionChangeRecommendation} changeRecommendation
     */
    public async setRejected(changeRecommendation: ViewMotionChangeRecommendation): Promise<void> {
        await this.patch({ rejected: true }, changeRecommendation);
    }

    /**
     * Sets if a change recommendation is internal (for the administrators) or not.
     *
     * @param {ViewMotionChangeRecommendation} changeRecommendation
     * @param {boolean} internal
     */
    public async setInternal(changeRecommendation: ViewMotionChangeRecommendation, internal: boolean): Promise<void> {
        await this.patch({ internal: internal }, changeRecommendation);
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
    public createMotionChangeRecommendationTemplate(
        motion: ViewMotion,
        lineRange: LineRange,
        lineLength: number
    ): ViewMotionChangeRecommendation {
        const motionText = this.lineNumbering.insertLineNumbers(motion.text, lineLength);

        const changeReco = new MotionChangeRecommendation();
        changeReco.line_from = lineRange.from;
        changeReco.line_to = lineRange.to;
        changeReco.type = ModificationType.TYPE_REPLACEMENT;
        changeReco.text = this.diffService.extractMotionLineRange(motionText, lineRange, false, lineLength, null);
        changeReco.rejected = false;
        changeReco.motion_id = motion.id;

        return new ViewMotionChangeRecommendation(changeReco);
    }

    /**
     * Creates a {@link ViewMotionChangeRecommendation} object based on the amendment ID, the precalculated
     * paragraphs (because we don't have access to motion-repository serice here) and the given lange range.
     * This object is not saved yet and does not yet have any changed HTML. It's meant to populate the UI form.
     *
     * @param {ViewMotion} amendment
     * @param {string[]} lineNumberedParagraphs
     * @param {LineRange} lineRange
     * @param {number} lineLength
     */
    public createAmendmentChangeRecommendationTemplate(
        amendment: ViewMotion,
        lineNumberedParagraphs: string[],
        lineRange: LineRange,
        lineLength: number
    ): ViewMotionChangeRecommendation {
        const consolidatedText = lineNumberedParagraphs.join('\n');

        const extracted = this.diffService.extractRangeByLineNumbers(consolidatedText, lineRange.from, lineRange.to);
        const extractedHtml =
            extracted.outerContextStart +
            extracted.innerContextStart +
            extracted.html +
            extracted.innerContextEnd +
            extracted.outerContextEnd;

        const changeReco = new MotionChangeRecommendation();
        changeReco.line_from = lineRange.from;
        changeReco.line_to = lineRange.to;
        changeReco.type = ModificationType.TYPE_REPLACEMENT;
        changeReco.rejected = false;
        changeReco.motion_id = amendment.id;
        changeReco.text = extractedHtml;

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
