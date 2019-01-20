import { AppConfig } from '../base/app-config';
import { Projector } from 'app/shared/models/core/projector';
import { Countdown } from 'app/shared/models/core/countdown';
import { ProjectorMessage } from 'app/shared/models/core/projector-message';

export const ProjectorAppConfig: AppConfig = {
    name: 'projector',
    models: [
        { collectionString: 'core/projector', model: Projector },
        { collectionString: 'core/countdown', model: Countdown },
        { collectionString: 'core/projector-message', model: ProjectorMessage }
    ],
    mainMenuEntries: [
        {
            route: '/projector-site/list',
            displayName: 'Projector',
            icon: 'videocam',
            weight: 700,
            permission: 'core.can_see_projector'
        }
    ]
};
