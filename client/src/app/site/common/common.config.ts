import { AppConfig } from '../../core/definitions/app-config';

export const CommonAppConfig: AppConfig = {
    name: 'common',
    mainMenuEntries: [
        {
            route: '/',
            displayName: 'Home',
            icon: 'home',
            weight: 100,
            permission: 'core.can_see_frontpage'
        }
    ]
};
