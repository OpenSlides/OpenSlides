import { AppConfig } from '../../core/app-config';
import { Motion } from '../../shared/models/motions/motion';
import { Category } from '../../shared/models/motions/category';
import { Workflow } from '../../shared/models/motions/workflow';
import { MotionCommentSection } from '../../shared/models/motions/motion-comment-section';
import { MotionChangeRecommendation } from '../../shared/models/motions/motion-change-reco';
import { MotionBlock } from '../../shared/models/motions/motion-block';
import { StatuteParagraph } from '../../shared/models/motions/statute-paragraph';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { CategoryRepositoryService } from 'app/core/repositories/motions/category-repository.service';
import { WorkflowRepositoryService } from 'app/core/repositories/motions/workflow-repository.service';
import { MotionCommentSectionRepositoryService } from 'app/core/repositories/motions/motion-comment-section-repository.service';
import { MotionBlockRepositoryService } from 'app/core/repositories/motions/motion-block-repository.service';
import { StatuteParagraphRepositoryService } from 'app/core/repositories/motions/statute-paragraph-repository.service';
import { ChangeRecommendationRepositoryService } from 'app/core/repositories/motions/change-recommendation-repository.service';
import { ViewCategory } from './models/view-category';
import { ViewMotionCommentSection } from './models/view-motion-comment-section';
import { ViewMotionChangeRecommendation } from './models/view-change-recommendation';
import { ViewMotionBlock } from './models/view-motion-block';
import { ViewStatuteParagraph } from './models/view-statute-paragraph';
import { ViewMotion } from './models/view-motion';
import { ViewWorkflow } from './models/view-workflow';

export const MotionsAppConfig: AppConfig = {
    name: 'motions',
    models: [
        {
            collectionString: 'motions/motion',
            model: Motion,
            viewModel: ViewMotion,
            searchOrder: 2,
            repository: MotionRepositoryService
        },
        {
            collectionString: 'motions/category',
            model: Category,
            viewModel: ViewCategory,
            searchOrder: 6,
            repository: CategoryRepositoryService
        },
        {
            collectionString: 'motions/workflow',
            model: Workflow,
            viewModel: ViewWorkflow,
            repository: WorkflowRepositoryService
        },
        {
            collectionString: 'motions/motion-comment-section',
            model: MotionCommentSection,
            viewModel: ViewMotionCommentSection,
            repository: MotionCommentSectionRepositoryService
        },
        {
            collectionString: 'motions/motion-change-recommendation',
            model: MotionChangeRecommendation,
            viewModel: ViewMotionChangeRecommendation,
            repository: ChangeRecommendationRepositoryService
        },
        {
            collectionString: 'motions/motion-block',
            model: MotionBlock,
            viewModel: ViewMotionBlock,
            searchOrder: 7,
            repository: MotionBlockRepositoryService
        },
        {
            collectionString: 'motions/statute-paragraph',
            model: StatuteParagraph,
            viewModel: ViewStatuteParagraph,
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
