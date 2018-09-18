import { AppConfig } from '../base/app-config';
import { Config } from '../../shared/models/core/config';

export const ConfigAppConfig: AppConfig = {
    name: 'settings',
    models: [{ collectionString: 'core/config', model: Config }],
    mainMenuEntries: [
        {
            route: '/settings',
            displayName: 'Settings',
            icon: 'cog',
            weight: 700,
            permission: 'core.can_manage_config'
        }
    ]
};
