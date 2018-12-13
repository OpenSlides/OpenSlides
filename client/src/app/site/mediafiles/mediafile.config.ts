import { AppConfig } from '../base/app-config';
import { Mediafile } from '../../shared/models/mediafiles/mediafile';

export const MediafileAppConfig: AppConfig = {
    name: 'mediafiles',
    models: [{ collectionString: 'mediafiles/mediafile', model: Mediafile, searchOrder: 5 }],
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
