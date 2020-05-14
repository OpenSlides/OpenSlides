import { AppConfig } from '../../core/definitions/app-config';
import { Permission } from 'app/core/core-services/operator.service';
import { ItemRepositoryService } from 'app/core/repositories/agenda/item-repository.service';
import { ListOfSpeakersRepositoryService } from 'app/core/repositories/agenda/list-of-speakers-repository.service';
import { ListOfSpeakers } from 'app/shared/models/agenda/list-of-speakers';
import { Item } from '../../shared/models/agenda/item';
import { ViewItem } from './models/view-item';
import { ViewListOfSpeakers } from './models/view-list-of-speakers';

export const AgendaAppConfig: AppConfig = {
    name: 'agenda',
    models: [
        { model: Item, viewModel: ViewItem, repository: ItemRepositoryService },
        {
            model: ListOfSpeakers,
            viewModel: ViewListOfSpeakers,
            repository: ListOfSpeakersRepositoryService
        }
    ],
    mainMenuEntries: [
        {
            route: '/agenda',
            displayName: 'Agenda',
            icon: 'today', // 'calendar_today' aligns wrong!
            weight: 200,
            permission: Permission.agendaCanSee
        }
    ]
};
