import { AppConfig } from '../base/app-config';
import { Item } from '../../shared/models/agenda/item';
import { Topic } from '../../shared/models/topics/topic';

export const AgendaAppConfig: AppConfig = {
    name: 'agenda',
    models: [{ collectionString: 'agenda/item', model: Item }, { collectionString: 'topics/topic', model: Topic, searchOrder: 1 }],
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
