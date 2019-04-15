import { BaseViewModel } from './base-view-model';

export interface Updateable {
    updateDependencies(update: BaseViewModel): void;
}
