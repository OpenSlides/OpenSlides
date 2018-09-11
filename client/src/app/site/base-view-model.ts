import { TranslateService } from '@ngx-translate/core';
import { BaseModel } from '../shared/models/base.model';

/**
 * Base class for view models. alls view models should have titles.
 */
export abstract class BaseViewModel {
    public abstract updateValues(update: BaseModel): void;

    /**
     * Should return the title for the detail view.
     * @param translate
     */
    public abstract getTitle(translate: TranslateService): string;

    /**
     * Should return the title for the list view.
     * @param translate
     */
    public getListTitle(translate: TranslateService): string {
        return this.getTitle(translate);
    }

    /**
     * Should return the title for the projector.
     * @param translate
     */
    public getProjector(translate: TranslateService): string {
        return this.getTitle(translate);
    }

    /**
     * Should return the title for the agenda list view.
     * @param translate
     */
    public getAgendaTitle(translate: TranslateService): string {
        return this.getTitle(translate);
    }
}
