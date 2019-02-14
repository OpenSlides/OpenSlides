import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatSnackBar, MatSelectChange } from '@angular/material';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Subscription } from 'rxjs';

import { ItemRepositoryService } from 'app/core/repositories/agenda/item-repository.service';
import { BaseViewComponent } from 'app/site/base/base-view';
import { CurrentListOfSpeakersSlideService } from 'app/site/projector/services/current-list-of-of-speakers-slide.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { ProjectorRepositoryService } from 'app/core/repositories/projector/projector-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { SpeakerState } from 'app/shared/models/agenda/speaker';
import { ViewItem } from '../../models/view-item';
import { ViewSpeaker } from '../../models/view-speaker';
import { ViewProjector } from 'app/site/projector/models/view-projector';
import { ViewUser } from 'app/site/users/models/view-user';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { DurationService } from 'app/core/ui-services/duration.service';

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
     * Determine if the user is viewing the current list if speakers
     */
    public currentListOfSpeakers = false;

    /**
     * Holds the view item to the given topic
     */
    public viewItem: ViewItem;

    /**
     * Holds the speakers
     */
    public speakers: ViewSpeaker[];

    /**
     * Holds a list of projectors. Only in CurrentListOfSpeakers mode
     */
    public projectors: ViewProjector[];

    /**
     * Holds the subscription to the current projector (if any)
     */
    private projectorSubscription: Subscription;

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
    public users: BehaviorSubject<ViewUser[]>;

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
     * Constructor for speaker list component. Generates the forms and subscribes
     * to the {@link currentListOfSpeakers}
     *
     * @param title
     * @param translate
     * @param snackBar
     * @param projectorRepo
     * @param route Angulars ActivatedRoute
     * @param DS the DataStore
     * @param itemRepo Repository fpr agenda items
     * @param op the current operator
     * @param promptService
     * @param currentListOfSpeakersService
     * @param durationService helper for speech duration display
     */
    public constructor(
        title: Title,
        translate: TranslateService,
        snackBar: MatSnackBar,
        projectorRepo: ProjectorRepositoryService,
        private route: ActivatedRoute,
        private itemRepo: ItemRepositoryService,
        private op: OperatorService,
        private promptService: PromptService,
        private currentListOfSpeakersService: CurrentListOfSpeakersSlideService,
        private durationService: DurationService,
        private userRepository: UserRepositoryService
    ) {
        super(title, translate, snackBar);
        this.isCurrentListOfSpeakers();
        this.addSpeakerForm = new FormGroup({ user_id: new FormControl([]) });

        if (this.currentListOfSpeakers) {
            this.projectors = projectorRepo.getViewModelList();
            this.showClosOfProjector(this.projectors[0]);
            projectorRepo.getViewModelListObservable().subscribe(newProjectors => {
                this.projectors = newProjectors;
            });
        } else {
            this.getItemByUrl();
        }
    }

    /**
     * Init.
     *
     * Observe users,
     * React to form changes
     */
    public ngOnInit(): void {
        // load and observe users
        this.users = new BehaviorSubject(this.userRepository.getViewModelList());
        this.userRepository.getViewModelListObservable().subscribe(users => this.users.next(users));

        // detect changes in the form
        this.addSpeakerForm.valueChanges.subscribe(formResult => {
            // resetting a form triggers a form.next(null) - check if user_id
            if (formResult && formResult.user_id) {
                this.addNewSpeaker(formResult.user_id);
            }
        });
    }

    /**
     * Check the URL to determine a current list of Speakers
     */
    private isCurrentListOfSpeakers(): void {
        if (this.route.snapshot.url[0]) {
            this.currentListOfSpeakers = this.route.snapshot.url[0].path === 'speakers';
        }
    }

    /**
     * Executed by selecting projectors
     *
     * @param event Holds the selected projector
     */
    public onSelectProjector(event: MatSelectChange): void {
        this.showClosOfProjector(event.value);
    }

    /**
     * Shows the current lost of speakers of a given projector.
     * Triggers after mat-select-change
     *
     * @param event Mat select change event, holds the projector in value
     */
    private showClosOfProjector(projector: ViewProjector): void {
        if (this.projectorSubscription) {
            this.projectorSubscription.unsubscribe();
            this.viewItem = null;
        }

        this.projectorSubscription = this.currentListOfSpeakersService
            .getAgendaItemObservable(projector)
            .subscribe(item => {
                if (item) {
                    this.setSpeakerList(item.id);
                }
            });
    }

    /**
     * Extract the ID from the url
     * Determine whether the speaker list belongs to a motion or a topic
     */
    private getItemByUrl(): void {
        const id = +this.route.snapshot.url[0];
        this.setSpeakerList(id);
    }

    /**
     * Sets the current item as list of speakers
     *
     * @param item the item to use as List of Speakers
     */
    private setSpeakerList(id: number): void {
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
     *
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

    /**
     * returns a locale-specific version of the starting time for the given speaker item
     *
     * @param speaker
     * @returns a time string using the current language setting of the client
     */
    public startTimeToString(speaker: ViewSpeaker): string {
        return new Date(speaker.begin_time).toLocaleString(this.translate.currentLang);
    }

    /**
     * get the duration of a speech
     *
     * @param speaker
     * @returns string representation of the duration in `[MM]M:SS minutes` format
     */
    public durationString(speaker: ViewSpeaker): string {
        const duration = Math.floor(
            (new Date(speaker.end_time).valueOf() - new Date(speaker.begin_time).valueOf()) / 1000
        );
        return `${this.durationService.secondDurationToString(duration)} ${this.translate.instant('minutes')}`;
    }
}
