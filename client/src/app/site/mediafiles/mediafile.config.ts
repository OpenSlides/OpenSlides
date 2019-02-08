import { AppConfig } from '../../core/app-config';
import { Mediafile } from '../../shared/models/mediafiles/mediafile';
import { MediafileRepositoryService } from 'app/core/repositories/mediafiles/mediafile-repository.service';
import { ViewMediafile } from './models/view-mediafile';

export const MediafileAppConfig: AppConfig = {
    name: 'mediafiles',
    models: [
        {
            collectionString: 'mediafiles/mediafile',
            model: Mediafile,
            viewModel: ViewMediafile,
            searchOrder: 5,
            repository: MediafileRepositoryService
        }
    ],
    mainMenuEntries: [
        {
            route: '/mediafiles',
            displayName: 'Files',
            icon: 'attach_file',
            weight: 600,
            permission: 'mediafiles.can_see'
        }
    ]
};
