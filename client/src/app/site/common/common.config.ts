import { AppConfig } from '../base/app-config';
import { ChatMessage } from '../../shared/models/core/chat-message';
import { Tag } from '../../shared/models/core/tag';

export const CommonAppConfig: AppConfig = {
    name: 'common',
    models: [
        { collectionString: 'core/chat-message', model: ChatMessage },
        { collectionString: 'core/tag', model: Tag }
    ],
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
