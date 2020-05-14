import { AppConfig } from '../../core/definitions/app-config';
import { Permission } from 'app/core/core-services/operator.service';
import { AssignmentOptionRepositoryService } from 'app/core/repositories/assignments/assignment-option-repository.service';
import { AssignmentPollRepositoryService } from 'app/core/repositories/assignments/assignment-poll-repository.service';
import { AssignmentRepositoryService } from 'app/core/repositories/assignments/assignment-repository.service';
import { AssignmentVoteRepositoryService } from 'app/core/repositories/assignments/assignment-vote-repository.service';
import { AssignmentOption } from 'app/shared/models/assignments/assignment-option';
import { AssignmentPoll } from 'app/shared/models/assignments/assignment-poll';
import { AssignmentVote } from 'app/shared/models/assignments/assignment-vote';
import { Assignment } from '../../shared/models/assignments/assignment';
import { ViewAssignment } from './models/view-assignment';
import { ViewAssignmentOption } from './models/view-assignment-option';
import { ViewAssignmentPoll } from './models/view-assignment-poll';
import { ViewAssignmentVote } from './models/view-assignment-vote';

export const AssignmentsAppConfig: AppConfig = {
    name: 'assignments',
    models: [
        {
            model: Assignment,
            viewModel: ViewAssignment,
            searchOrder: 3,
            repository: AssignmentRepositoryService
        },
        {
            model: AssignmentPoll,
            viewModel: ViewAssignmentPoll,
            repository: AssignmentPollRepositoryService
        },
        {
            model: AssignmentVote,
            viewModel: ViewAssignmentVote,
            repository: AssignmentVoteRepositoryService
        },
        {
            model: AssignmentOption,
            viewModel: ViewAssignmentOption,
            repository: AssignmentOptionRepositoryService
        }
    ],
    mainMenuEntries: [
        {
            route: '/assignments',
            displayName: 'Elections',
            icon: 'how_to_vote',
            weight: 400,
            permission: Permission.assignmentsCanSee
        }
    ]
};
