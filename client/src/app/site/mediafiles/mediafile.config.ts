import { AppConfig } from '../../core/definitions/app-config';
import { Permission } from 'app/core/core-services/operator.service';
import { MediafileRepositoryService } from 'app/core/repositories/mediafiles/mediafile-repository.service';
import { Mediafile } from '../../shared/models/mediafiles/mediafile';
import { ViewMediafile } from './models/view-mediafile';

export const MediafileAppConfig: AppConfig = {
    name: 'mediafiles',
    models: [
        {
            model: Mediafile,
            viewModel: ViewMediafile,
            searchOrder: 5,
            openInNewTab: true,
            repository: MediafileRepositoryService
        }
    ],
    mainMenuEntries: [
        {
            route: '/mediafiles/files',
            displayName: 'Files',
            icon: 'attach_file',
            weight: 600,
            permission: Permission.mediafilesCanSee
        }
    ]
};
