import { BaseModel } from 'app/shared/models/base/base-model';
import { ViewItem } from 'app/site/agenda/models/view-item';
import { ViewListOfSpeakers } from 'app/site/agenda/models/view-list-of-speakers';
import { BaseProjectableViewModel } from 'app/site/base/base-projectable-view-model';
import {
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

    public getAgendaListTitle(titleInformation: T): string {
        // Return the agenda title with the model's verbose name appended
        const numberPrefix = titleInformation.agenda_item_number() ? `${titleInformation.agenda_item_number()} · ` : '';
        return numberPrefix + this.getTitle(titleInformation) + ' (' + this.getVerboseName() + ')';
    }

    public getAgendaSubtitle(viewModel: V): string | null {
        return null;
    }

    public getAgendaSlideTitle(titleInformation: T): string {
        const itemNumber = titleInformation.agenda_item_number();
        const numberPrefix = itemNumber ? `${itemNumber} · ` : '';
        return numberPrefix + this.getTitle(titleInformation);
    }

    /**
     * Function to get the list-title without the item-number.
     *
     * @param titleInformation The title-information for an object.
     *
     * @returns {string} The title without any prefix like item-number.
     */
    public getAgendaListTitleWithoutItemNumber(titleInformation: T): string {
        return this.getTitle(titleInformation) + ' (' + this.getVerboseName() + ')';
    }

    public getListOfSpeakersTitle = (titleInformation: T) => {
        return this.getAgendaListTitle(titleInformation);
    };

    public getListOfSpeakersSlideTitle = (titleInformation: T) => {
        return this.getAgendaSlideTitle(titleInformation);
    };

    protected createViewModelWithTitles(model: M): V {
        const viewModel = super.createViewModelWithTitles(model);
        viewModel.getAgendaListTitle = () => this.getAgendaListTitle(viewModel);
        viewModel.getAgendaListTitleWithoutItemNumber = () => this.getAgendaListTitleWithoutItemNumber(viewModel);
        viewModel.getAgendaSlideTitle = () => this.getAgendaSlideTitle(viewModel);
        viewModel.getAgendaSubtitle = () => this.getAgendaSubtitle(viewModel);
        viewModel.getListOfSpeakersTitle = () => this.getListOfSpeakersTitle(viewModel);
        viewModel.getListOfSpeakersSlideTitle = () => this.getListOfSpeakersSlideTitle(viewModel);
        return viewModel;
    }
}
