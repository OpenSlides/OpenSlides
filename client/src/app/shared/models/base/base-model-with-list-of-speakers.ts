import { BaseModel } from './base-model';

export function isBaseModelWithListOfSpeakers(obj: any): obj is BaseModelWithListOfSpeakers {
    return !!obj && (<BaseModelWithListOfSpeakers>obj).list_of_speakers_id !== undefined;
}

/**
 * A base model with a list of speakers. The id is always given by the server.
 */
export abstract class BaseModelWithListOfSpeakers<T = object> extends BaseModel<T> {
    public list_of_speakers_id: number;
}
