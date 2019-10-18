import { AppConfig } from '../../core/definitions/app-config';
import { TagRepositoryService } from 'app/core/repositories/tags/tag-repository.service';
import { Tag } from '../../shared/models/core/tag';
import { ViewTag } from './models/view-tag';

export const TagAppConfig: AppConfig = {
    name: 'tag',
    models: [
        {
            model: Tag,
            viewModel: ViewTag,
            searchOrder: 8,
            repository: TagRepositoryService
        }
    ]
};
