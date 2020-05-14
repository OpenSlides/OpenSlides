import { AppConfig } from '../../core/definitions/app-config';
import { Permission } from 'app/core/core-services/operator.service';
import { CountdownRepositoryService } from 'app/core/repositories/projector/countdown-repository.service';
import { ProjectionDefaultRepositoryService } from 'app/core/repositories/projector/projection-default-repository.service';
import { ProjectorMessageRepositoryService } from 'app/core/repositories/projector/projector-message-repository.service';
import { ProjectorRepositoryService } from 'app/core/repositories/projector/projector-repository.service';
import { Countdown } from 'app/shared/models/core/countdown';
import { ProjectionDefault } from 'app/shared/models/core/projection-default';
import { Projector } from 'app/shared/models/core/projector';
import { ProjectorMessage } from 'app/shared/models/core/projector-message';
import { ViewCountdown } from './models/view-countdown';
import { ViewProjectionDefault } from './models/view-projection-default';
import { ViewProjector } from './models/view-projector';
import { ViewProjectorMessage } from './models/view-projector-message';

export const ProjectorAppConfig: AppConfig = {
    name: 'projector',
    models: [
        {
            model: Projector,
            viewModel: ViewProjector,
            repository: ProjectorRepositoryService
        },
        {
            model: ProjectionDefault,
            viewModel: ViewProjectionDefault,
            repository: ProjectionDefaultRepositoryService
        },
        {
            model: Countdown,
            viewModel: ViewCountdown,
            repository: CountdownRepositoryService
        },
        {
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
            permission: Permission.coreCanSeeProjector
        }
    ]
};
