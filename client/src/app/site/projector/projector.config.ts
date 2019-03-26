import { AppConfig } from '../../core/app-config';
import { Projector } from 'app/shared/models/core/projector';
import { Countdown } from 'app/shared/models/core/countdown';
import { ProjectorMessage } from 'app/shared/models/core/projector-message';
import { ProjectorRepositoryService } from 'app/core/repositories/projector/projector-repository.service';
import { CountdownRepositoryService } from 'app/core/repositories/projector/countdown-repository.service';
import { ProjectorMessageRepositoryService } from 'app/core/repositories/projector/projector-message-repository.service';
import { ViewProjector } from './models/view-projector';
import { ViewCountdown } from './models/view-countdown';
import { ViewProjectorMessage } from './models/view-projector-message';
import { ProjectionDefault } from 'app/shared/models/core/projection-default';
import { ViewProjectionDefault } from './models/view-projection-default';
import { ProjectionDefaultRepositoryService } from 'app/core/repositories/projector/projection-default-repository.service';

export const ProjectorAppConfig: AppConfig = {
    name: 'projector',
    models: [
        {
            collectionString: 'core/projector',
            model: Projector,
            viewModel: ViewProjector,
            repository: ProjectorRepositoryService
        },
        {
            collectionString: 'core/projection-default',
            model: ProjectionDefault,
            viewModel: ViewProjectionDefault,
            repository: ProjectionDefaultRepositoryService
        },
        {
            collectionString: 'core/countdown',
            model: Countdown,
            viewModel: ViewCountdown,
            repository: CountdownRepositoryService
        },
        {
            collectionString: 'core/projector-message',
            model: ProjectorMessage,
            viewModel: ViewProjectorMessage,
            repository: ProjectorMessageRepositoryService
        }
    ],
    mainMenuEntries: [
        {
            route: '/projectors',
            displayName: 'Projector',
            icon: 'videocam',
            weight: 700,
            permission: 'core.can_see_projector'
        }
    ]
};
