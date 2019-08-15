import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { OpenSlidesStatusService } from 'app/core/core-services/openslides-status.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { CategoryRepositoryService } from 'app/core/repositories/motions/category-repository.service';
import { MotionBlockRepositoryService } from 'app/core/repositories/motions/motion-block-repository.service';
import { MotionCommentSectionRepositoryService } from 'app/core/repositories/motions/motion-comment-section-repository.service';
import { WorkflowRepositoryService } from 'app/core/repositories/motions/workflow-repository.service';
import { TagRepositoryService } from 'app/core/repositories/tags/tag-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { MotionFilterListService } from './motion-filter-list.service';
import { ViewMotion } from '../models/view-motion';

/**
 * Filter service for motion blocks
 */
@Injectable({
    providedIn: 'root'
})
export class BlockDetailFilterListService extends MotionFilterListService {
    /**
     * Private acessor for the blockId
     */
    private _blockId: number;

    /**
     * setter for the blockId
     */
    public set blockId(id: number) {
        this._blockId = id;
    }

    /**
     *
     * @param store
     * @param OSStatus
     * @param categoryRepo
     * @param motionBlockRepo
     * @param commentRepo
     * @param tagRepo
     * @param workflowRepo
     * @param translate
     * @param operator
     * @param config
     */
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
        config: ConfigService
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
            config
        );
    }

    /**
     * @override from parent
     * @param viewMotions
     * @return
     */
    protected preFilter(viewMotions: ViewMotion[]): ViewMotion[] {
        return viewMotions.filter(motion => motion.motion_block_id === this._blockId);
    }
}
