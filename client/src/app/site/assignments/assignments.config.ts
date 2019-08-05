import { AppConfig } from '../../core/definitions/app-config';
import { AssignmentRepositoryService } from 'app/core/repositories/assignments/assignment-repository.service';
import { Assignment } from '../../shared/models/assignments/assignment';
import { ViewAssignment } from './models/view-assignment';

export const AssignmentsAppConfig: AppConfig = {
    name: 'assignments',
    models: [
        {
            collectionString: 'assignments/assignment',
            model: Assignment,
            viewModel: ViewAssignment,
            // searchOrder: 3, // TODO: enable, if there is a detail page and so on.
            repository: AssignmentRepositoryService
        }
    ],
    mainMenuEntries: [
        {
            route: '/assignments',
            displayName: 'Elections',
            icon: 'how_to_vote',
            weight: 400,
            permission: 'assignments.can_see'
        }
    ]
};
