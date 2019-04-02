import { AppConfig } from '../../core/app-config';

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
