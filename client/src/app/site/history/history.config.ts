import { AppConfig } from '../../core/app-config';
import { History } from 'app/shared/models/core/history';
import { HistoryRepositoryService } from 'app/core/repositories/history/history-repository.service';

/**
 * Config object for history.
 * Hooks into the navigation.
 */
export const HistoryAppConfig: AppConfig = {
    name: 'history',
    models: [{ collectionString: 'core/history', model: History, repository: HistoryRepositoryService }],
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
