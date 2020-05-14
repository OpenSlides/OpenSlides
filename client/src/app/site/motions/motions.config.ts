import { AppConfig } from '../../core/definitions/app-config';
import { Permission } from 'app/core/core-services/operator.service';
import { CategoryRepositoryService } from 'app/core/repositories/motions/category-repository.service';
import { ChangeRecommendationRepositoryService } from 'app/core/repositories/motions/change-recommendation-repository.service';
import { MotionBlockRepositoryService } from 'app/core/repositories/motions/motion-block-repository.service';
import { MotionCommentSectionRepositoryService } from 'app/core/repositories/motions/motion-comment-section-repository.service';
import { MotionOptionRepositoryService } from 'app/core/repositories/motions/motion-option-repository.service';
import { MotionPollRepositoryService } from 'app/core/repositories/motions/motion-poll-repository.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { MotionVoteRepositoryService } from 'app/core/repositories/motions/motion-vote-repository.service';
import { StateRepositoryService } from 'app/core/repositories/motions/state-repository.service';
import { StatuteParagraphRepositoryService } from 'app/core/repositories/motions/statute-paragraph-repository.service';
import { WorkflowRepositoryService } from 'app/core/repositories/motions/workflow-repository.service';
import { MotionOption } from 'app/shared/models/motions/motion-option';
import { MotionPoll } from 'app/shared/models/motions/motion-poll';
import { MotionVote } from 'app/shared/models/motions/motion-vote';
import { State } from 'app/shared/models/motions/state';
import { Category } from '../../shared/models/motions/category';
import { Motion } from '../../shared/models/motions/motion';
import { MotionBlock } from '../../shared/models/motions/motion-block';
import { MotionChangeRecommendation } from '../../shared/models/motions/motion-change-reco';
import { MotionCommentSection } from '../../shared/models/motions/motion-comment-section';
import { StatuteParagraph } from '../../shared/models/motions/statute-paragraph';
import { ViewCategory } from './models/view-category';
import { ViewMotion } from './models/view-motion';
import { ViewMotionBlock } from './models/view-motion-block';
import { ViewMotionChangeRecommendation } from './models/view-motion-change-recommendation';
import { ViewMotionCommentSection } from './models/view-motion-comment-section';
import { ViewMotionOption } from './models/view-motion-option';
import { ViewMotionPoll } from './models/view-motion-poll';
import { ViewMotionVote } from './models/view-motion-vote';
import { ViewState } from './models/view-state';
import { ViewStatuteParagraph } from './models/view-statute-paragraph';
import { ViewWorkflow } from './models/view-workflow';
import { Workflow } from '../../shared/models/motions/workflow';

export const MotionsAppConfig: AppConfig = {
    name: 'motions',
    models: [
        {
            model: Motion,
            viewModel: ViewMotion,
            searchOrder: 2,
            repository: MotionRepositoryService
        },
        {
            model: Category,
            viewModel: ViewCategory,
            searchOrder: 6,
            repository: CategoryRepositoryService
        },
        {
            model: Workflow,
            viewModel: ViewWorkflow,
            repository: WorkflowRepositoryService
        },
        {
            model: State,
            viewModel: ViewState,
            repository: StateRepositoryService
        },
        {
            model: MotionCommentSection,
            viewModel: ViewMotionCommentSection,
            repository: MotionCommentSectionRepositoryService
        },
        {
            model: MotionChangeRecommendation,
            viewModel: ViewMotionChangeRecommendation,
            repository: ChangeRecommendationRepositoryService
        },
        {
            model: MotionBlock,
            viewModel: ViewMotionBlock,
            searchOrder: 7,
            repository: MotionBlockRepositoryService
        },
        {
            model: StatuteParagraph,
            viewModel: ViewStatuteParagraph,
            searchOrder: 9,
            repository: StatuteParagraphRepositoryService
        },
        { model: MotionPoll, viewModel: ViewMotionPoll, repository: MotionPollRepositoryService },
        { model: MotionOption, viewModel: ViewMotionOption, repository: MotionOptionRepositoryService },
        { model: MotionVote, viewModel: ViewMotionVote, repository: MotionVoteRepositoryService }
    ],
    mainMenuEntries: [
        {
            route: '/motions',
            displayName: 'Motions',
            icon: 'assignment',
            weight: 300,
            permission: Permission.motionsCanSee
        }
    ]
};
