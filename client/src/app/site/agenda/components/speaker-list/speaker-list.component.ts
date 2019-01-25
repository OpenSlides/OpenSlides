import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

import { SpeakerState } from 'app/shared/models/agenda/speaker';
import { User } from 'app/shared/models/users/user';
import { ViewSpeaker } from '../../models/view-speaker';
import { DataStoreService } from 'app/core/services/data-store.service';
import { AgendaRepositoryService } from '../../services/agenda-repository.service';
import { ViewItem } from '../../models/view-item';
import { OperatorService } from 'app/core/services/operator.service';
import { BaseViewComponent } from 'app/site/base/base-view';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material';
import { PromptService } from 'app/core/services/prompt.service';

/**
 * The list of speakers for agenda items.
 */
@Component({
    selector: 'os-speaker-list',
    templateUrl: './speaker-list.component.html',
    styleUrls: ['./speaker-list.component.scss']
})
export class SpeakerListComponent extends BaseViewComponent implements OnInit {
    /**
     * Holds the view item to the given topic
     */
    public viewItem: ViewItem;

    /**
     * Holds the speakers
     */
    public speakers: ViewSpeaker[];

    /**
     * Holds the active speaker
     */
    public activeSpeaker: ViewSpeaker;

    /**
     * Holds the speakers who were marked done
     */
    public finishedSpeakers: ViewSpeaker[];

    /**
     * Hold the users
     */
    public users: BehaviorSubject<User[]>;

    /**
     * Required for the user search selector
     */
    public addSpeakerForm: FormGroup;

    /**
     * @returns true if the items' speaker list is currently not open
     */
    public get closedList(): boolean {
        return this.viewItem && this.viewItem.item.speaker_list_closed;
    }

    public get emptyList(): boolean {
        if (this.speakers && this.speakers.length) {
            return false;
        } else if (this.finishedSpeakers && this.finishedSpeakers.length) {
            return false;
        }
        return this.activeSpeaker ? false : true;
    }

    /**
     * Constructor for speaker list component
     * @param title
     * @param translate
     * @param snackBar
     * @param route Angulars ActivatedRoute
     * @param DS the DataStore
     * @param itemRepo Repository fpr agenda items
     * @param op the current operator
     */
    public constructor(
        title: Title,
        translate: TranslateService,
        snackBar: MatSnackBar,
        private route: ActivatedRoute,
        private DS: DataStoreService,
        private itemRepo: AgendaRepositoryService,
        private op: OperatorService,
        private promptService: PromptService
    ) {
        super(title, translate, snackBar);
        this.addSpeakerForm = new FormGroup({ user_id: new FormControl([]) });
        this.getAgendaItemByUrl();
    }

    /**
     * Init.
     *
     * Observe users,
     * React to form changes
     */
    public ngOnInit(): void {
        // load and observe users
        this.users = new BehaviorSubject(this.DS.getAll(User));
        this.DS.changeObservable.subscribe(model => {
            if (model instanceof User) {
                this.users.next(this.DS.getAll(User));
            }
        });

        // detect changes in the form
        this.addSpeakerForm.valueChanges.subscribe(formResult => {
            // resetting a form triggers a form.next(null) - check if user_id
            if (formResult && formResult.user_id) {
                this.addNewSpeaker(formResult.user_id);
            }
        });
    }

    /**
     * Extract the ID from the url
     * Determine whether the speaker list belongs to a motion or a topic
     */
    public getAgendaItemByUrl(): void {
        const id = +this.route.snapshot.url[0];

        this.itemRepo.getViewModelObservable(id).subscribe(newAgendaItem => {
            if (newAgendaItem) {
                this.viewItem = newAgendaItem;

                const allSpeakers = this.itemRepo.createViewSpeakers(newAgendaItem.item);

                this.speakers = allSpeakers.filter(speaker => speaker.state === SpeakerState.WAITING);
                this.finishedSpeakers = allSpeakers.filter(speaker => speaker.state === SpeakerState.FINISHED);
                this.activeSpeaker = allSpeakers.find(speaker => speaker.state === SpeakerState.CURRENT);
            }
        });
    }

    /**
     * Create a speaker out of an id
     * @param userId the user id to add to the list. No parameter adds the operators user as speaker.
     */
    public addNewSpeaker(userId?: number): void {
        this.itemRepo.addSpeaker(userId, this.viewItem).then(() => this.addSpeakerForm.reset(), this.raiseError);
    }

    /**
     * React to manual in the sorting order.
     * Informs the repo about changes in the order
     * @param listInNewOrder Contains the newly ordered list of ViewSpeakers
     */
    public onSortingChange(listInNewOrder: ViewSpeaker[]): void {
        // extract the ids from the ViewSpeaker array
        const userIds = listInNewOrder.map(speaker => speaker.id);
        this.itemRepo.sortSpeakers(userIds, this.viewItem.item).then(null, this.raiseError);
    }

    /**
     * Click on the mic button to mark a speaker as speaking
     *
     * @param item the speaker marked in the list
     */
    public onStartButton(item: ViewSpeaker): void {
        this.itemRepo.startSpeaker(item.id, this.viewItem).then(null, this.raiseError);
    }

    /**
     * Click on the mic-cross button
     */
    public onStopButton(): void {
        this.itemRepo.stopCurrentSpeaker(this.viewItem).then(null, this.raiseError);
    }

    /**
     * Click on the star button
     *
     * @param item
     */
    public onMarkButton(item: ViewSpeaker): void {
        this.itemRepo.markSpeaker(item.user.id, !item.marked, this.viewItem).then(null, this.raiseError);
    }

    /**
     * Click on the X button
     *
     * @param speaker
     */
    public onDeleteButton(speaker?: ViewSpeaker): void {
        this.itemRepo.deleteSpeaker(this.viewItem, speaker ? speaker.id : null).then(null, this.raiseError);
    }

    /**
     * Returns true if the operator is in the list of (waiting) speakers
     *
     * @returns whether or not the current operator is in the list
     */
    public isOpInList(): boolean {
        return this.speakers.some(speaker => speaker.user.id === this.op.user.id);
    }

    /**
     * Checks how often a speaker has already finished speaking
     *
     * @param speaker
     * @returns 0 or the number of times a speaker occurs in finishedSpeakers
     */
    public hasSpokenCount(speaker: ViewSpeaker): number {
        return this.finishedSpeakers.filter(finishedSpeaker => finishedSpeaker.user.id === speaker.user.id).length;
    }

    /**
     * Closes the current speaker list
     */
    public closeSpeakerList(): Promise<void> {
        if (!this.viewItem.item.speaker_list_closed) {
            return this.itemRepo.update({ speaker_list_closed: true }, this.viewItem);
        }
    }

    /**
     * Opens the speaker list for the current item
     */
    public openSpeakerList(): Promise<void> {
        if (this.viewItem.item.speaker_list_closed) {
            return this.itemRepo.update({ speaker_list_closed: false }, this.viewItem);
        }
    }

    /**
     * Clears the speaker list by removing all current, past and future speakers
     * after a confirmation dialog
     */
    public async clearSpeakerList(): Promise<void> {
        const content = this.translate.instant('This will clear all speakers from the list.');
        if (await this.promptService.open('Are you sure?', content)) {
            this.itemRepo.deleteAllSpeakers(this.viewItem);
        }
    }
}
