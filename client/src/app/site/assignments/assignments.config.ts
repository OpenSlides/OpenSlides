import { AppConfig } from '../../core/app-config';
import { Assignment } from '../../shared/models/assignments/assignment';
import { AssignmentRepositoryService } from 'app/core/repositories/assignments/assignment-repository.service';

export const AssignmentsAppConfig: AppConfig = {
    name: 'assignments',
    models: [
        {
            collectionString: 'assignments/assignment',
            model: Assignment,
            searchOrder: 3,
            repository: AssignmentRepositoryService
        }
    ],
    mainMenuEntries: [
        {
            route: '/assignments',
            displayName: 'Elections',
            icon: 'poll', // TODO not yet available: 'how_to_vote',
            weight: 400,
            permission: 'assignments.can_see'
        }
    ]
};
