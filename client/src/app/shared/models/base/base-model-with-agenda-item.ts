import { BaseModel } from './base-model';

export function isBaseModelWithAgendaItem(obj: any): obj is BaseModelWithAgendaItem {
    return !!obj && (<BaseModelWithAgendaItem>obj).agenda_item_id !== undefined;
}

/**
 * A base model which has an agenda item. These models have a `agenda_item_id` in any case.
 */
export abstract class BaseModelWithAgendaItem<T = object> extends BaseModel<T> {
    public agenda_item_id: number;
}
