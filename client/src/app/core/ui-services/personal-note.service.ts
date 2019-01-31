import { Injectable } from '@angular/core';

import { Observable, BehaviorSubject } from 'rxjs';

import { DataStoreService } from '../core-services/data-store.service';
import { OperatorService } from '../core-services/operator.service';
import { PersonalNote, PersonalNoteObject, PersonalNoteContent } from '../../shared/models/users/personal-note';
import { BaseModel } from '../../shared/models/base/base-model';
import { HttpService } from '../core-services/http.service';

/**
 * All subjects are organized by the collection string and id of the model.
 */
interface PersonalNoteSubjects {
    [collectionString: string]: {
        [id: number]: BehaviorSubject<PersonalNoteContent>;
    };
}

/**
 * Handles personal notes.
 *
 * Get updated by subscribing to `getPersonalNoteObserver`. Save personal notes by calling
 * `savePersonalNote`.
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
     * All subjects for all observers.
     */
    private subjects: PersonalNoteSubjects = {};

    /**
     * Watches for changes in the personal note model.
     */
    public constructor(private operator: OperatorService, private DS: DataStoreService, private http: HttpService) {
        operator.getObservable().subscribe(() => this.updatePersonalNoteObject());
        this.DS.changeObservable.subscribe(model => {
            if (model instanceof PersonalNote) {
                this.updatePersonalNoteObject();
            }
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

        this.updateSubscribers();
    }

    /**
     * Update all subscribers.
     */
    private updateSubscribers(): void {
        Object.keys(this.subjects).forEach(collectionString => {
            Object.keys(this.subjects[collectionString]).forEach(id => {
                this.subjects[collectionString][id].next(this.getPersonalNoteContent(collectionString, +id));
            });
        });
    }

    /**
     * Gets the content from a note by the collection string and id.
     */
    private getPersonalNoteContent(collectionString: string, id: number): PersonalNoteContent {
        if (
            !this.personalNoteObject ||
            !this.personalNoteObject.notes ||
            !this.personalNoteObject.notes[collectionString] ||
            !this.personalNoteObject.notes[collectionString][id]
        ) {
            return null;
        }
        return this.personalNoteObject.notes[collectionString][id];
    }

    /**
     * Returns an observalbe for a given BaseModel.
     * @param model The model to observe the personal note from.
     */
    public getPersonalNoteObserver(model: BaseModel): Observable<PersonalNoteContent> {
        if (!this.subjects[model.collectionString]) {
            this.subjects[model.collectionString] = {};
        }
        if (!this.subjects[model.collectionString][model.id]) {
            const subject = new BehaviorSubject<PersonalNoteContent>(
                this.getPersonalNoteContent(model.collectionString, model.id)
            );
            this.subjects[model.collectionString][model.id] = subject;
        }
        return this.subjects[model.collectionString][model.id].asObservable();
    }

    /**
     * Saves the personal note for the given model.
     * @param model The model the content belongs to
     * @param content The new content.
     */
    public async savePersonalNote(model: BaseModel, content: PersonalNoteContent): Promise<void> {
        const pnObject: Partial<PersonalNoteObject> = this.personalNoteObject || {};
        if (!pnObject.notes) {
            pnObject.notes = {};
        }
        if (!pnObject.notes[model.collectionString]) {
            pnObject.notes[model.collectionString] = {};
        }

        pnObject.notes[model.collectionString][model.id] = content;
        if (!pnObject.id) {
            await this.http.post('rest/users/personal-note/', pnObject);
        } else {
            await this.http.put(`rest/users/personal-note/${pnObject.id}/`, pnObject);
        }
    }

    /**
     * Changes the 'favorite' status of a personal note, without changing other information
     *
     * @param model
     * @param star The new status to set
     */
    public async setPersonalNoteStar(model: BaseModel, star: boolean): Promise<void> {
        let content: PersonalNoteContent = this.getPersonalNoteContent(model.collectionString, model.id);
        if (!content) {
            content = { note: null, star: star };
        }
        content.star = star;
        return this.savePersonalNote(model, content);
    }
}
