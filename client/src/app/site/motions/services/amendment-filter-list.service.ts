import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { OpenSlidesStatusService } from 'app/core/core-services/openslides-status.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { CategoryRepositoryService } from 'app/core/repositories/motions/category-repository.service';
import { MotionBlockRepositoryService } from 'app/core/repositories/motions/motion-block-repository.service';
import { MotionCommentSectionRepositoryService } from 'app/core/repositories/motions/motion-comment-section-repository.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { WorkflowRepositoryService } from 'app/core/repositories/motions/workflow-repository.service';
import { TagRepositoryService } from 'app/core/repositories/tags/tag-repository.service';
import { OsFilter } from 'app/core/ui-services/base-filter-list.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { MotionFilterListService } from './motion-filter-list.service';
import { ViewMotion } from '../models/view-motion';

/**
 * Filter the list of Amendments
 */
@Injectable({
    providedIn: 'root'
})
export class AmendmentFilterListService extends MotionFilterListService {
    /**
     * Private accessor for an amendment id
     */
    private _parentMotionId: number;

    /**
     * set the storage key nae
     */
    protected storageKey = 'AmendmentList';

    /**
     * publicly get an amendment id
     */
    public set parentMotionId(id: number) {
        this._parentMotionId = id;
    }

    private motionFilterOptions: OsFilter = {
        property: 'parent_id',
        label: 'Motion',
        options: []
    };

    public constructor(
        store: StorageService,
        OSStatus: OpenSlidesStatusService,
        categoryRepo: CategoryRepositoryService,
        motionBlockRepo: MotionBlockRepositoryService,
        commentRepo: MotionCommentSectionRepositoryService,
        tagRepo: TagRepositoryService,
        workflowRepo: WorkflowRepositoryService,
        translate: TranslateService,
        operator: OperatorService,
        configService: ConfigService,
        motionRepo: MotionRepositoryService
    ) {
        super(
            store,
            OSStatus,
            categoryRepo,
            motionBlockRepo,
            commentRepo,
            tagRepo,
            workflowRepo,
            translate,
            operator,
            configService
        );

        this.updateFilterForRepo(motionRepo, this.motionFilterOptions, null, (model: ViewMotion) =>
            motionRepo.hasAmendments(model)
        );
    }

    /**
     * @override from base filter list service
     *
     * @returns the list of Motions which only contains view motions
     */
    protected preFilter(motions: ViewMotion[]): ViewMotion[] {
        return motions.filter(motion => {
            if (!!this._parentMotionId) {
                return motion.parent_id === this._parentMotionId;
            } else {
                return !!motion.parent_id;
            }
        });
    }

    /**
     * Currently, no filters for the amendment list, except the pre-filter
     */
    protected getFilterDefinitions(): OsFilter[] {
        return [this.motionFilterOptions].concat(super.getFilterDefinitions());
    }
}
