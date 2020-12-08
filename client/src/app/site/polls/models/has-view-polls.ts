import { ViewBasePoll } from './view-base-poll';

export interface HasViewPolls<T extends ViewBasePoll> {
    polls?: T[];
}
