import { AppConfig } from '../base/app-config';
import { User } from '../../shared/models/users/user';
import { Group } from '../../shared/models/users/group';
import { PersonalNote } from '../../shared/models/users/personal-note';

export const UsersAppConfig: AppConfig = {
    name: 'users',
    models: [
        { collectionString: 'users/user', model: User },
        { collectionString: 'users/group', model: Group },
        { collectionString: 'users/personal-note', model: PersonalNote }
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
