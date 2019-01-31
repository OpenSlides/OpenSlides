import { AppConfig } from '../../core/app-config';
import { Item } from '../../shared/models/agenda/item';
import { Topic } from '../../shared/models/topics/topic';
import { AgendaRepositoryService } from 'app/core/repositories/agenda/agenda-repository.service';
import { TopicRepositoryService } from 'app/core/repositories/agenda/topic-repository.service';

export const AgendaAppConfig: AppConfig = {
    name: 'agenda',
    models: [
        { collectionString: 'agenda/item', model: Item, repository: AgendaRepositoryService },
        { collectionString: 'topics/topic', model: Topic, searchOrder: 1, repository: TopicRepositoryService }
    ],
    mainMenuEntries: [
        {
            route: '/agenda',
            displayName: 'Agenda',
            icon: 'today', // 'calendar_today' aligns wrong!
            weight: 200,
            permission: 'agenda.can_see'
        }
    ]
};
