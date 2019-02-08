import { AppConfig } from '../../core/app-config';
import { Item } from '../../shared/models/agenda/item';
import { Topic } from '../../shared/models/topics/topic';
import { ItemRepositoryService } from 'app/core/repositories/agenda/item-repository.service';
import { TopicRepositoryService } from 'app/core/repositories/agenda/topic-repository.service';
import { ViewTopic } from './models/view-topic';
import { ViewItem } from './models/view-item';

export const AgendaAppConfig: AppConfig = {
    name: 'agenda',
    models: [
        { collectionString: 'agenda/item', model: Item, viewModel: ViewItem, repository: ItemRepositoryService },
        {
            collectionString: 'topics/topic',
            model: Topic,
            viewModel: ViewTopic,
            searchOrder: 1,
            repository: TopicRepositoryService
        }
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
