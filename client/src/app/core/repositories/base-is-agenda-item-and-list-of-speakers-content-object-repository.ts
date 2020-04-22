import { BaseModel } from 'app/shared/models/base/base-model';
import { ViewItem } from 'app/site/agenda/models/view-item';
import { ViewListOfSpeakers } from 'app/site/agenda/models/view-list-of-speakers';
import { BaseProjectableViewModel } from 'app/site/base/base-projectable-view-model';
import {
    AgendaListTitle,
    BaseViewModelWithAgendaItem,
    TitleInformationWithAgendaItem
} from 'app/site/base/base-view-model-with-agenda-item';
import { BaseViewModelWithListOfSpeakers } from 'app/site/base/base-view-model-with-list-of-speakers';
import {
    IBaseIsAgendaItemContentObjectRepository,
    isBaseIsAgendaItemContentObjectRepository
} from './base-is-agenda-item-content-object-repository';
import {
    IBaseIsListOfSpeakersContentObjectRepository,
    isBaseIsListOfSpeakersContentObjectRepository
} from './base-is-list-of-speakers-content-object-repository';
import { BaseRepository } from './base-repository';

export function isBaseIsAgendaItemAndListOfSpeakersContentObjectRepository(
    obj: any
): obj is BaseIsAgendaItemAndListOfSpeakersContentObjectRepository<any, any, any> {
    return (
        !!obj && isBaseIsAgendaItemContentObjectRepository(obj) && isBaseIsListOfSpeakersContentObjectRepository(obj)
    );
}

/**
 * The base repository for objects with an agenda item and a list of speakers. This is some kind of
 * multi-inheritance by implementing both inherit classes again...
 */
export abstract class BaseIsAgendaItemAndListOfSpeakersContentObjectRepository<
    V extends BaseProjectableViewModel & BaseViewModelWithAgendaItem & BaseViewModelWithListOfSpeakers & T,
    M extends BaseModel,
    T extends TitleInformationWithAgendaItem
> extends BaseRepository<V, M, T>
    implements
        IBaseIsAgendaItemContentObjectRepository<V, M, T>,
        IBaseIsListOfSpeakersContentObjectRepository<V, M, T> {
    protected extendRelations(): void {
        this.relationDefinitions.push({
            type: 'M2O',
            ownIdKey: 'agenda_item_id',
            ownKey: 'item',
            foreignViewModel: ViewItem
        });
        this.relationDefinitions.push({
            type: 'M2O',
            ownIdKey: 'list_of_speakers_id',
            ownKey: 'listOfSpeakers',
            foreignViewModel: ViewListOfSpeakers
        });
    }

    public getAgendaListTitle(titleInformation: T): AgendaListTitle {
        // Return the agenda title with the model's verbose name appended
        const numberPrefix = titleInformation.agenda_item_number() ? `${titleInformation.agenda_item_number()} · ` : '';
        const title = numberPrefix + this.getTitle(titleInformation) + ' (' + this.getVerboseName() + ')';
        return { title };
    }

    public getAgendaSlideTitle(titleInformation: T): string {
        const itemNumber = titleInformation.agenda_item_number();
        const numberPrefix = itemNumber ? `${itemNumber} · ` : '';
        return numberPrefix + this.getTitle(titleInformation);
    }

    public getListOfSpeakersTitle = (titleInformation: T) => {
        return this.getAgendaListTitle(titleInformation).title;
    };

    public getListOfSpeakersSlideTitle = (titleInformation: T) => {
        return this.getAgendaSlideTitle(titleInformation);
    };

    protected createViewModelWithTitles(model: M): V {
        const viewModel = super.createViewModelWithTitles(model);
        viewModel.getAgendaListTitle = () => this.getAgendaListTitle(viewModel);
        viewModel.getAgendaSlideTitle = () => this.getAgendaSlideTitle(viewModel);
        viewModel.getListOfSpeakersTitle = () => this.getListOfSpeakersTitle(viewModel);
        viewModel.getListOfSpeakersSlideTitle = () => this.getListOfSpeakersSlideTitle(viewModel);
        return viewModel;
    }
}
