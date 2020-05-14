import { AppConfig } from '../../core/definitions/app-config';
import { Permission } from 'app/core/core-services/operator.service';

export const CommonAppConfig: AppConfig = {
    name: 'common',
    mainMenuEntries: [
        {
            route: '/',
            displayName: 'Home',
            icon: 'home',
            weight: 100,
            permission: Permission.coreCanSeeFrontpage
        }
    ]
};
