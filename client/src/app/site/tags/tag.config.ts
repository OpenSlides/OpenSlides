import { AppConfig } from '../base/app-config';
import { Tag } from '../../shared/models/core/tag';

export const TagAppConfig: AppConfig = {
    name: 'tag',
    models: [{ collectionString: 'core/tag', model: Tag, searchOrder: 8 }]
};
