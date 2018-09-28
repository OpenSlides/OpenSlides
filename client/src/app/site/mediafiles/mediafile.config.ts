import { AppConfig } from '../base/app-config';
import { Mediafile } from '../../shared/models/mediafiles/mediafile';

export const MediafileAppConfig: AppConfig = {
    name: 'mediafiles',
    models: [{ collectionString: 'mediafiles/mediafile', model: Mediafile }],
    mainMenuEntries: [
        {
            route: '/mediafiles',
            displayName: 'Files',
            icon: 'paperclip',
            weight: 600,
            permission: 'mediafiles.can_see'
        }
    ]
};
