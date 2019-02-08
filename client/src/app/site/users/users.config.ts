import { AppConfig } from '../../core/app-config';
import { User } from '../../shared/models/users/user';
import { Group } from '../../shared/models/users/group';
import { PersonalNote } from '../../shared/models/users/personal-note';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { PersonalNoteRepositoryService } from 'app/core/repositories/users/personal-note-repository.service';
import { ViewUser } from './models/view-user';
import { ViewGroup } from './models/view-group';
import { ViewPersonalNote } from './models/view-personal-note';

export const UsersAppConfig: AppConfig = {
    name: 'users',
    models: [
        {
            collectionString: 'users/user',
            model: User,
            viewModel: ViewUser,
            searchOrder: 4,
            repository: UserRepositoryService
        },
        { collectionString: 'users/group', model: Group, viewModel: ViewGroup, repository: GroupRepositoryService },
        {
            collectionString: 'users/personal-note',
            model: PersonalNote,
            viewModel: ViewPersonalNote,
            repository: PersonalNoteRepositoryService
        }
    ],
    mainMenuEntries: [
        {
            route: '/users',
            displayName: 'Participants',
            icon: 'people',
            weight: 500,
            permission: 'users.can_see_name'
        }
    ]
};
