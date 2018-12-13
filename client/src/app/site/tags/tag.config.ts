import { AppConfig } from '../base/app-config';
import { Tag } from '../../shared/models/core/tag';

export const TagAppConfig: AppConfig = {
    name: 'tag',
    models: [{ collectionString: 'core/tag', model: Tag, searchOrder: 8 }],
    mainMenuEntries: [
        {
            route: '/tags',
            displayName: 'Tags',
            icon: 'turned_in',
            weight: 1100,
            permission: 'core.can_manage_tags'
        }
    ]
};
