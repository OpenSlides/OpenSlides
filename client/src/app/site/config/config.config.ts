import { AppConfig } from '../../core/definitions/app-config';
import { Permission } from 'app/core/core-services/operator.service';
import { Config } from '../../shared/models/core/config';
import { ConfigRepositoryService } from '../../core/repositories/config/config-repository.service';
import { ViewConfig } from './models/view-config';

export const ConfigAppConfig: AppConfig = {
    name: 'settings',
    models: [{ model: Config, viewModel: ViewConfig, repository: ConfigRepositoryService }],
    mainMenuEntries: [
        {
            route: '/settings',
            displayName: 'Settings',
            icon: 'settings',
            weight: 1300,
            permission: Permission.coreCanManageConfig
        }
    ]
};
