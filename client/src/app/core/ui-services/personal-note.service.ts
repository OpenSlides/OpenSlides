import { Injectable } from '@angular/core';

import { BaseViewModel } from 'app/site/base/base-view-model';
import { BaseModel } from '../../shared/models/base/base-model';
import { DataStoreService } from '../core-services/data-store.service';
import { HttpService } from '../core-services/http.service';
import { OperatorService } from '../core-services/operator.service';
import { PersonalNote, PersonalNoteContent, PersonalNoteObject } from '../../shared/models/users/personal-note';

/**
 * Handles saving personal notes.
 */
@Injectable({
    providedIn: 'root'
})
export class PersonalNoteService {
    /**
     * The personal note object for the operator
     */
    private personalNoteObject: PersonalNoteObject;

    /**
     * Watches for changes in the personal note model and the operator.
     */
    public constructor(private operator: OperatorService, private DS: DataStoreService, private http: HttpService) {
        operator.getUserObservable().subscribe(() => this.updatePersonalNoteObject());
        this.DS.getChangeObservable(PersonalNote).subscribe(_ => {
            this.updatePersonalNoteObject();
        });
    }

    /**
     * Updates the personal note object and notifies the subscribers.
     */
    private updatePersonalNoteObject(): void {
        if (this.operator.isAnonymous) {
            return;
        }

        // Get the note for the operator.
        const operatorId = this.operator.user.id;
        const objects = this.DS.filter(PersonalNote, pn => pn.user_id === operatorId);
        this.personalNoteObject = objects.length === 0 ? null : objects[0];
    }

    /**
     * Saves the personal note for the given model.
     * @param model The model the content belongs to
     * @param content The new content.
     */
    public async savePersonalNote(model: BaseModel | BaseViewModel, content: PersonalNoteContent): Promise<void> {
        const pnObject: Partial<PersonalNoteObject> = this.personalNoteObject || {};
        if (!pnObject.notes) {
            pnObject.notes = {};
        }
        if (!pnObject.notes[model.collectionString]) {
            pnObject.notes[model.collectionString] = {};
        }

        pnObject.notes[model.collectionString][model.id] = content;
        await this.savePersonalNoteObject(pnObject);
    }

    /**
     * Sets the 'favorite' status for several models of a type in bulk
     *
     * @param models The model the content belongs to
     * @param star The new 'favorite' status
     */
    public async bulkSetStar(models: (BaseModel | BaseViewModel)[], star: boolean): Promise<void> {
        if (!models.length) {
            return;
        }
        const pnObject: Partial<PersonalNoteObject> = this.personalNoteObject || {};
        if (!pnObject.notes) {
            pnObject.notes = {};
        }
        for (const model of models) {
            if (!pnObject.notes[model.collectionString]) {
                pnObject.notes[model.collectionString] = {};
            }
            if (pnObject.notes[model.collectionString][model.id]) {
                pnObject.notes[model.collectionString][model.id].star = star;
            } else {
                pnObject.notes[model.collectionString][model.id] = { star: star, note: '' };
            }
        }
        await this.savePersonalNoteObject(pnObject);
    }

    /**
     * Sends an updated personal note to the server
     *
     * @param pnObject a partial (if new) or complete personal note object
     */
    private async savePersonalNoteObject(pnObject: Partial<PersonalNoteObject>): Promise<void> {
        if (!pnObject.id) {
            await this.http.post('/rest/users/personal-note/', pnObject);
        } else {
            await this.http.put(`/rest/users/personal-note/${pnObject.id}/`, pnObject);
        }
    }
}
