import { BaseModel } from './base-model';
import { BaseModelWithAgendaItem, isBaseModelWithAgendaItem } from './base-model-with-agenda-item';
import { BaseModelWithListOfSpeakers, isBaseModelWithListOfSpeakers } from './base-model-with-list-of-speakers';

export function isBaseModelWithAgendaItemAndListOfSpeakers(obj: any): obj is BaseModelWithAgendaItemAndListOfSpeakers {
    return !!obj && isBaseModelWithAgendaItem(obj) && isBaseModelWithListOfSpeakers(obj);
}

/**
 * A base model with an agenda item and a list of speakers.
 */
export abstract class BaseModelWithAgendaItemAndListOfSpeakers<T = object>
    extends BaseModel<T>
    implements BaseModelWithAgendaItem<T>, BaseModelWithListOfSpeakers<T> {
    public agenda_item_id: number;
    public list_of_speakers_id: number;
}
