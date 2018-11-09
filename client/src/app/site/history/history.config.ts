import { AppConfig } from '../base/app-config';
import { History } from 'app/shared/models/core/history';

/**
 * Config object for history.
 * Hooks into the navigation.
 */
export const HistoryAppConfig: AppConfig = {
    name: 'history',
    models: [{ collectionString: 'core/history', model: History }],
    mainMenuEntries: [
        {
            route: '/history',
            displayName: 'History',
            icon: 'history',
            weight: 1200,
            permission: 'core.view_history'
        }
    ]
};
