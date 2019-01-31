import { AppConfig } from '../../core/app-config';
import { Motion } from '../../shared/models/motions/motion';
import { Category } from '../../shared/models/motions/category';
import { Workflow } from '../../shared/models/motions/workflow';
import { MotionCommentSection } from '../../shared/models/motions/motion-comment-section';
import { MotionChangeReco } from '../../shared/models/motions/motion-change-reco';
import { MotionBlock } from '../../shared/models/motions/motion-block';
import { StatuteParagraph } from '../../shared/models/motions/statute-paragraph';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { CategoryRepositoryService } from 'app/core/repositories/motions/category-repository.service';
import { WorkflowRepositoryService } from 'app/core/repositories/motions/workflow-repository.service';
import { MotionCommentSectionRepositoryService } from 'app/core/repositories/motions/motion-comment-section-repository.service';
import { MotionBlockRepositoryService } from 'app/core/repositories/motions/motion-block-repository.service';
import { StatuteParagraphRepositoryService } from 'app/core/repositories/motions/statute-paragraph-repository.service';
import { ChangeRecommendationRepositoryService } from 'app/core/repositories/motions/change-recommendation-repository.service';

export const MotionsAppConfig: AppConfig = {
    name: 'motions',
    models: [
        { collectionString: 'motions/motion', model: Motion, searchOrder: 2, repository: MotionRepositoryService },
        {
            collectionString: 'motions/category',
            model: Category,
            searchOrder: 6,
            repository: CategoryRepositoryService
        },
        { collectionString: 'motions/workflow', model: Workflow, repository: WorkflowRepositoryService },
        {
            collectionString: 'motions/motion-comment-section',
            model: MotionCommentSection,
            repository: MotionCommentSectionRepositoryService
        },
        {
            collectionString: 'motions/motion-change-recommendation',
            model: MotionChangeReco,
            repository: ChangeRecommendationRepositoryService
        },
        {
            collectionString: 'motions/motion-block',
            model: MotionBlock,
            searchOrder: 7,
            repository: MotionBlockRepositoryService
        },
        {
            collectionString: 'motions/statute-paragraph',
            model: StatuteParagraph,
            searchOrder: 9,
            repository: StatuteParagraphRepositoryService
        }
    ],
    mainMenuEntries: [
        {
            route: '/motions',
            displayName: 'Motions',
            icon: 'assignment',
            weight: 300,
            permission: 'motions.can_see'
        }
    ]
};
