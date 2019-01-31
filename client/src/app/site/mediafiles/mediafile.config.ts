import { AppConfig } from '../../core/app-config';
import { Mediafile } from '../../shared/models/mediafiles/mediafile';
import { MediafileRepositoryService } from 'app/core/repositories/mediafiles/mediafile-repository.service';

export const MediafileAppConfig: AppConfig = {
    name: 'mediafiles',
    models: [
        {
            collectionString: 'mediafiles/mediafile',
            model: Mediafile,
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
