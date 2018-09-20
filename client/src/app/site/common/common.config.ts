import { AppConfig } from '../base/app-config';
import { Projector } from '../../shared/models/core/projector';
import { Countdown } from '../../shared/models/core/countdown';
import { ChatMessage } from '../../shared/models/core/chat-message';
import { ProjectorMessage } from '../../shared/models/core/projector-message';
import { Tag } from '../../shared/models/core/tag';

export const CommonAppConfig: AppConfig = {
    name: 'common',
    models: [
        { collectionString: 'core/projector', model: Projector },
        { collectionString: 'core/chat-message', model: ChatMessage },
        { collectionString: 'core/countdown', model: Countdown },
        { collectionString: 'core/projector-message', model: ProjectorMessage },
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
