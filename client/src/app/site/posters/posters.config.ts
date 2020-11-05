import { Permission } from 'app/core/core-services/operator.service';
import { AppConfig } from 'app/core/definitions/app-config';
import { PosterRepositoryService } from 'app/core/repositories/posters/poster-repository.service';
import { Poster } from 'app/shared/models/posters/poster';
import { ViewPoster } from './models/view-poster';

export const PostersAppConfig: AppConfig = {
    name: 'poster',
    models: [
        {
            model: Poster,
            viewModel: ViewPoster,
            searchOrder: 9,
            repository: PosterRepositoryService
        }
    ],
    mainMenuEntries: [
        {
            route: '/posters',
            displayName: 'Posters',
            icon: 'wallpaper',
            weight: 450,
            // TODO: Perm
            permission: Permission.coreCanSeeFrontpage
        }
    ]
};
