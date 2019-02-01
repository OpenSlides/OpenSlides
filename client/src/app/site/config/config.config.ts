import { AppConfig } from '../../core/app-config';
import { Config } from '../../shared/models/core/config';
import { ConfigRepositoryService } from './services/config-repository.service';

export const ConfigAppConfig: AppConfig = {
    name: 'settings',
    models: [{ collectionString: 'core/config', model: Config, repository: ConfigRepositoryService }],
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
