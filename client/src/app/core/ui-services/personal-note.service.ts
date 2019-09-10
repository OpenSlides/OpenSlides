import { Injectable } from '@angular/core';

import { BaseViewModel } from 'app/site/base/base-view-model';
import { BaseModel } from '../../shared/models/base/base-model';
import { DataStoreService } from '../core-services/data-store.service';
import { HttpService } from '../core-services/http.service';
import { OperatorService } from '../core-services/operator.service';
import { PersonalNote, PersonalNoteContent, PersonalNoteObject } from '../../shared/models/users/personal-note';

type PersonalNoteRequestData = {
    collection: string;
    id: number;
    content: object;
}[];

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
    private personalNoteObject: PersonalNoteObject | null;

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
            this.personalNoteObject = null;
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
        await this.savePersonalNoteObject([
            {
                collection: model.collectionString,
                id: model.id,
                content: content
            }
        ]);
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
        const requestData: PersonalNoteRequestData = models.map(model => {
            if (!pnObject.notes[model.collectionString]) {
                pnObject.notes[model.collectionString] = {};
            }
            if (pnObject.notes[model.collectionString][model.id]) {
                pnObject.notes[model.collectionString][model.id].star = star;
            } else {
                pnObject.notes[model.collectionString][model.id] = { star: star, note: '' };
            }
            return {
                collection: model.collectionString,
                id: model.id,
                content: pnObject.notes[model.collectionString][model.id]
            };
        });
        await this.savePersonalNoteObject(requestData);
    }

    /**
     * Sends an updated personal note to the server
     *
     * @param requestData The data to send to the server
     */
    private async savePersonalNoteObject(requestData: PersonalNoteRequestData): Promise<void> {
        await this.http.post(`/rest/users/personal-note/create_or_update/`, requestData);
    }
}
