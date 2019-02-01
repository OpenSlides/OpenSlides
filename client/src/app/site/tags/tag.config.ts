import { AppConfig } from '../../core/app-config';
import { Tag } from '../../shared/models/core/tag';
import { TagRepositoryService } from 'app/core/repositories/tags/tag-repository.service';
import { ViewTag } from './models/view-tag';

export const TagAppConfig: AppConfig = {
    name: 'tag',
    models: [
        {
            collectionString: 'core/tag',
            model: Tag,
            viewModel: ViewTag,
            searchOrder: 8,
            repository: TagRepositoryService
        }
    ]
};
