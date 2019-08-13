import { AppConfig } from '../../core/definitions/app-config';
import { Config } from '../../shared/models/core/config';
import { ConfigRepositoryService } from '../../core/repositories/config/config-repository.service';
import { ViewConfig } from './models/view-config';

export const ConfigAppConfig: AppConfig = {
    name: 'settings',
    models: [
        { collectionString: 'core/config', model: Config, viewModel: ViewConfig, repository: ConfigRepositoryService }
    ],
    mainMenuEntries: [
        {
            route: '/settings',
            displayName: 'Settings',
            icon: 'settings',
            weight: 1300,
            permission: 'core.can_manage_config'
        }
    ]
};
