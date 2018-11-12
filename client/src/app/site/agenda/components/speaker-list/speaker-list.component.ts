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

/**
 * The list of speakers for agenda items.
 */
@Component({
    selector: 'os-speaker-list',
    templateUrl: './speaker-list.component.html',
    styleUrls: ['./speaker-list.component.scss']
})
export class SpeakerListComponent implements OnInit {
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
     * Constructor for speaker list component
     * @param route Angulars ActivatedRoute
     * @param DS the DataStore
     * @param itemRepo Repository fpr agenda items
     * @param op the current operator
     */
    public constructor(
        private route: ActivatedRoute,
        private DS: DataStoreService,
        private itemRepo: AgendaRepositoryService,
        private op: OperatorService
    ) {
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
    public async addNewSpeaker(userId?: number): Promise<void> {
        await this.itemRepo.addSpeaker(userId, this.viewItem.item);
        this.addSpeakerForm.reset();
    }

    /**
     * React to manual in the sorting order.
     * Informs the repo about changes in the order
     * @param listInNewOrder Contains the newly ordered list of ViewSpeakers
     */
    public onSortingChange(listInNewOrder: ViewSpeaker[]): void {
        // extract the ids from the ViewSpeaker array
        const userIds = listInNewOrder.map(speaker => speaker.id);
        this.itemRepo.sortSpeakers(userIds, this.viewItem.item);
    }

    /**
     * Click on the mic button to mark a speaker as speaking
     * @param item the speaker marked in the list
     */
    public onStartButton(item: ViewSpeaker): void {
        this.itemRepo.startSpeaker(item.id, this.viewItem.item);
    }

    /**
     * Click on the mic-cross button
     */
    public onStopButton(): void {
        this.itemRepo.stopSpeaker(this.viewItem.item);
    }

    /**
     * Click on the star button
     * @param item
     */
    public onMarkButton(item: ViewSpeaker): void {
        this.itemRepo.markSpeaker(item.user.id, !item.marked, this.viewItem.item);
    }

    /**
     * Click on the X button
     * @param item
     */
    public onDeleteButton(item?: ViewSpeaker): void {
        this.itemRepo.deleteSpeaker(this.viewItem.item, item ? item.id : null);
    }

    /**
     * Returns true if the operator is in the list of (waiting) speakers
     *
     * @returns whether or not the current operator is in the list
     */
    public isOpInList(): boolean {
        return this.speakers.some(speaker => speaker.user.id === this.op.user.id);
    }
}
