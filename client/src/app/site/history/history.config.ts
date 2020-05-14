import { AppConfig } from '../../core/definitions/app-config';
import { Permission } from 'app/core/core-services/operator.service';

/**
 * Config object for history.
 * Hooks into the navigation.
 */
export const HistoryAppConfig: AppConfig = {
    name: 'history',
    mainMenuEntries: [
        {
            route: '/history',
            displayName: 'History',
            icon: 'history',
            weight: 1200,
            permission: Permission.coreCanSeeHistory
        }
    ]
};
