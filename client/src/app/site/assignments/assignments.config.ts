import { AppConfig } from '../base/app-config';
import { Assignment } from '../../shared/models/assignments/assignment';

export const AssignmentsAppConfig: AppConfig = {
    name: 'assignments',
    models: [{ collectionString: 'assignments/assignment', model: Assignment }],
    mainMenuEntries: [
        {
            route: '/assignments',
            displayName: 'Elections',
            icon: 'chart-pie',
            weight: 400,
            permission: 'assignments.can_see'
        }
    ]
};
