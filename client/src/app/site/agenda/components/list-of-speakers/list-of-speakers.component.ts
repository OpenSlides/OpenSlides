import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Subscription } from 'rxjs';

import { CollectionStringMapperService } from 'app/core/core-services/collection-string-mapper.service';
import { OperatorService, Permission } from 'app/core/core-services/operator.service';
import { ListOfSpeakersRepositoryService } from 'app/core/repositories/agenda/list-of-speakers-repository.service';
import { ProjectorRepositoryService } from 'app/core/repositories/projector/projector-repository.service';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { DurationService } from 'app/core/ui-services/duration.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ViewportService } from 'app/core/ui-services/viewport.service';
import { Selectable } from 'app/shared/components/selectable';
import { SortingListComponent } from 'app/shared/components/sorting-list/sorting-list.component';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewProjector } from 'app/site/projector/models/view-projector';
import { CurrentListOfSpeakersSlideService } from 'app/site/projector/services/current-list-of-speakers-slide.service';
import { CurrentListOfSpeakersService } from 'app/site/projector/services/current-list-of-speakers.service';
import { ViewUser } from 'app/site/users/models/view-user';
import { ViewListOfSpeakers } from '../../models/view-list-of-speakers';
import { SpeakerState, ViewSpeaker } from '../../models/view-speaker';

/**
 * The list of speakers for agenda items.
 */
@Component({
    selector: 'os-list-of-speakers',
    templateUrl: './list-of-speakers.component.html',
    styleUrls: ['./list-of-speakers.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListOfSpeakersComponent extends BaseViewComponent implements OnInit {
    @ViewChild(SortingListComponent)
    public listElement: SortingListComponent;

    /**
     * Determine if the user is viewing the current list if speakers
     */
    public isCurrentListOfSpeakers = false;

    /**
     * Holds whether the list is in sort mode or not
     */
    public isSortMode = false;

    /**
     * Holds the view item to the given topic
     */
    public viewListOfSpeakers: ViewListOfSpeakers;

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
    public users = new BehaviorSubject<ViewUser[]>([]);

    /**
     * A filtered list of users, excluding those not available to be added to the list
     */
    public filteredUsers = new BehaviorSubject<ViewUser[]>([]);

    /**
     * Required for the user search selector
     */
    public addSpeakerForm: FormGroup;

    /**
     * Check, if list-view is seen on mobile-device.
     */
    public isMobile = false;

    /**
     * @returns true if the list of speakers list is currently closed
     */
    public get isListOfSpeakersClosed(): boolean {
        return this.viewListOfSpeakers && this.viewListOfSpeakers.closed;
    }

    public get isListOfSpeakersEmpty(): boolean {
        if (this.speakers && this.speakers.length) {
            return false;
        } else if (this.finishedSpeakers && this.finishedSpeakers.length) {
            return false;
        }
        return !this.activeSpeaker;
    }

    /**
     * @returns true if the current user can be added to the list of speakers
     */
    public get canAddSelf(): boolean {
        return !this.config.instant('agenda_present_speakers_only') || this.operator.user.is_present;
    }

    /**
     * Used to detect changes in the projector reference.
     */
    private closReferenceProjectorId: number | null;

    private closSubscription: Subscription | null;

    public showFistContributionHint: boolean;

    /**
     * List of speakers to save temporarily changes made by sorting-list.
     */
    private speakerListAsSelectable: Selectable[] = [];

    /**
     * Constructor for speaker list component. Generates the forms.
     *
     * @param title
     * @param translate
     * @param snackBar
     * @param projectorRepo
     * @param route Angulars ActivatedRoute
     * @param DS the DataStore
     * @param listOfSpeakersRepo Repository for list of speakers
     * @param operator the current operator
     * @param promptService
     * @param currentListOfSpeakersService
     * @param durationService helper for speech duration display
     */
    public constructor(
        title: Title,
        protected translate: TranslateService, // protected required for ng-translate-extract
        snackBar: MatSnackBar,
        private projectorRepo: ProjectorRepositoryService,
        private route: ActivatedRoute,
        private listOfSpeakersRepo: ListOfSpeakersRepositoryService,
        private operator: OperatorService,
        private promptService: PromptService,
        private currentListOfSpeakersService: CurrentListOfSpeakersService,
        private durationService: DurationService,
        private userRepository: UserRepositoryService,
        private collectionStringMapper: CollectionStringMapperService,
        private currentListOfSpeakersSlideService: CurrentListOfSpeakersSlideService,
        private config: ConfigService,
        private viewport: ViewportService,
        private cd: ChangeDetectorRef
    ) {
        super(title, translate, snackBar);
        this.addSpeakerForm = new FormGroup({ user_id: new FormControl() });
    }

    /**
     * Init.
     *
     * Observe users,
     * React to form changes
     */
    public ngOnInit(): void {
        // Check, if we are on the current list of speakers.
        this.isCurrentListOfSpeakers =
            this.route.snapshot.url.length > 0
                ? this.route.snapshot.url[this.route.snapshot.url.length - 1].path === 'speakers'
                : true;

        if (this.isCurrentListOfSpeakers) {
            this.projectors = this.projectorRepo.getViewModelList();
            this.updateClosProjector();
            this.subscriptions.push(
                this.projectorRepo.getViewModelListObservable().subscribe(newProjectors => {
                    this.projectors = newProjectors;
                    this.updateClosProjector();
                })
            );
        } else {
            const id = +this.route.snapshot.url[this.route.snapshot.url.length - 1].path;
            this.setListOfSpeakersId(id);
        }

        this.subscriptions.push(
            // Observe the user list
            this.userRepository.getViewModelListObservable().subscribe(users => {
                this.users.next(users);
                this.filterUsers();
                this.cd.markForCheck();
            }),
            // ovserve changes to the add-speaker form
            this.addSpeakerForm.valueChanges.subscribe(formResult => {
                // resetting a form triggers a form.next(null) - check if user_id
                if (formResult && formResult.user_id) {
                    this.addNewSpeaker(formResult.user_id);
                }
            }),
            // observe changes to the viewport
            this.viewport.isMobileSubject.subscribe(isMobile => this.checkSortMode(isMobile)),
            // observe changes the agenda_present_speakers_only config
            this.config.get('agenda_present_speakers_only').subscribe(() => {
                this.filterUsers();
            }),
            // observe changes to the agenda_show_first_contribution config
            this.config.get<boolean>('agenda_show_first_contribution').subscribe(show => {
                this.showFistContributionHint = show;
            })
        );
    }

    public opCanManage(): boolean {
        return this.operator.hasPerms(Permission.agendaCanManageListOfSpeakers);
    }

    /**
     * Shows the current list of speakers (CLOS) of a given projector.
     */
    private updateClosProjector(): void {
        if (!this.projectors.length) {
            return;
        }
        const referenceProjector = this.projectors[0].referenceProjector;
        if (!referenceProjector || referenceProjector.id === this.closReferenceProjectorId) {
            return;
        }
        this.closReferenceProjectorId = referenceProjector.id;

        if (this.projectorSubscription) {
            this.projectorSubscription.unsubscribe();
            this.viewListOfSpeakers = null;
        }

        this.projectorSubscription = this.currentListOfSpeakersService
            .getListOfSpeakersObservable(referenceProjector)
            .subscribe(listOfSpeakers => {
                if (listOfSpeakers) {
                    this.setListOfSpeakers(listOfSpeakers);
                }
            });
        this.subscriptions.push(this.projectorSubscription);
    }

    /**
     * @returns the CLOS slide build descriptor
     */
    public getClosSlide(): ProjectorElementBuildDeskriptor {
        return this.currentListOfSpeakersSlideService.getSlide(false);
    }

    /**
     * Sets the current list of speakers id to show
     *
     * @param id the list of speakers id
     */
    private setListOfSpeakersId(id: number): void {
        if (this.closSubscription) {
            this.closSubscription.unsubscribe();
        }

        this.closSubscription = this.listOfSpeakersRepo.getViewModelObservable(id).subscribe(listOfSpeakers => {
            if (listOfSpeakers) {
                this.setListOfSpeakers(listOfSpeakers);
            }
        });
    }

    private setListOfSpeakers(listOfSpeakers: ViewListOfSpeakers): void {
        const title = this.isCurrentListOfSpeakers
            ? 'Current list of speakers'
            : listOfSpeakers.getTitle() + ` - ${this.translate.instant('List of speakers')}`;
        super.setTitle(title);
        this.viewListOfSpeakers = listOfSpeakers;
        const allSpeakers = this.viewListOfSpeakers.speakers.sort((a, b) => a.weight - b.weight);
        this.speakers = allSpeakers.filter(speaker => speaker.state === SpeakerState.WAITING);
        // Since the speaker repository is not a normal repository, sorting cannot be handled there
        this.speakers.sort((a: ViewSpeaker, b: ViewSpeaker) => a.weight - b.weight);
        this.filterUsers();
        this.finishedSpeakers = allSpeakers.filter(speaker => speaker.state === SpeakerState.FINISHED);

        // convert begin time to date and sort
        this.finishedSpeakers.sort((a: ViewSpeaker, b: ViewSpeaker) => {
            const aTime = new Date(a.begin_time).getTime();
            const bTime = new Date(b.begin_time).getTime();
            return aTime - bTime;
        });

        this.activeSpeaker = allSpeakers.find(speaker => speaker.state === SpeakerState.CURRENT);
    }

    /**
     * @returns the verbose name of the model of the content object from viewItem.
     * E.g. if a motion is the current content object, "Motion" will be the returned value.
     */
    public getContentObjectProjectorButtonText(): string {
        const verboseName = this.collectionStringMapper
            .getRepository(this.viewListOfSpeakers.listOfSpeakers.content_object.collection)
            .getVerboseName();
        return verboseName;
    }

    /**
     * Create a speaker out of an id
     *
     * @param userId the user id to add to the list. No parameter adds the operators user as speaker.
     */
    public addNewSpeaker(userId?: number): void {
        this.listOfSpeakersRepo
            .createSpeaker(this.viewListOfSpeakers, userId)
            .then(() => this.addSpeakerForm.reset(), this.raiseError);
    }

    /**
     * Saves sorting on mobile devices.
     */
    public onMobileSaveSorting(): void {
        this.onSaveSorting(this.speakerListAsSelectable);
        this.isSortMode = false;
    }

    /**
     * Receives an updated list from sorting-event.
     *
     * @param sortedSpeakerList The updated list.
     */
    public onSortingChanged(sortedSpeakerList: Selectable[]): void {
        this.speakerListAsSelectable = sortedSpeakerList;
        if (!this.isMobile) {
            this.onSaveSorting(sortedSpeakerList);
        }
    }

    /**
     * Restore old order on cancel
     */
    public onCancelSorting(): void {
        if (this.isSortMode) {
            this.isSortMode = false;
            this.listElement.restore();
        }
    }

    /**
     * Click on the mic button to mark a speaker as speaking
     *
     * @param speaker the speaker marked in the list
     */
    public async onStartButton(speaker: ViewSpeaker): Promise<void> {
        try {
            await this.listOfSpeakersRepo.startSpeaker(this.viewListOfSpeakers, speaker);
            this.filterUsers();
        } catch (e) {
            this.raiseError(e);
        }
    }

    /**
     * Click on the mic-cross button
     */
    public async onStopButton(): Promise<void> {
        try {
            await this.listOfSpeakersRepo.stopCurrentSpeaker(this.viewListOfSpeakers);
            this.filterUsers();
        } catch (e) {
            this.raiseError(e);
        }
    }

    /**
     * Click on the star button. Toggles the marked attribute.
     *
     * @param speaker The speaker clicked on.
     */
    public onMarkButton(speaker: ViewSpeaker): void {
        this.listOfSpeakersRepo.markSpeaker(this.viewListOfSpeakers, speaker, !speaker.marked).catch(this.raiseError);
    }

    /**
     * Removes the last finished speaker from the list an re-adds him on pole position
     */
    public readdLastSpeaker(): void {
        this.listOfSpeakersRepo.readdLastSpeaker(this.viewListOfSpeakers).catch(this.raiseError);
    }

    /**
     * Click on the X button - removes the speaker from the list of speakers
     *
     * @param speaker optional speaker to remove. If none is given,
     * the operator themself is removed
     */
    public async onDeleteButton(speaker?: ViewSpeaker): Promise<void> {
        const title = this.translate.instant(
            'Are you sure you want to delete this speaker from this list of speakers?'
        );
        if (await this.promptService.open(title)) {
            try {
                await this.listOfSpeakersRepo.delete(this.viewListOfSpeakers, speaker ? speaker.id : null);
                this.filterUsers();
            } catch (e) {
                this.raiseError(e);
            }
        }
    }

    /**
     * Returns true if the operator is in the list of (waiting) speakers
     *
     * @returns whether or not the current operator is in the list
     */
    public isOpInList(): boolean {
        return this.speakers.some(speaker => speaker.user_id === this.operator.user.id);
    }

    /**
     * Checks how often a speaker has already finished speaking
     *
     * @param speaker
     * @returns 0 or the number of times a speaker occurs in finishedSpeakers
     */
    public hasSpokenCount(speaker: ViewSpeaker): number {
        return this.finishedSpeakers.filter(finishedSpeaker => {
            if (finishedSpeaker && finishedSpeaker.user) {
                return finishedSpeaker.user.id === speaker.user.id;
            }
        }).length;
    }

    /**
     * Returns true if the speaker did never appear on any list of speakers
     *
     * @param speaker
     */
    public isFirstContribution(speaker: ViewSpeaker): boolean {
        return this.listOfSpeakersRepo.isFirstContribution(speaker);
    }

    /**
     * Closes the current list of speakers
     */
    public closeSpeakerList(): Promise<void> {
        if (!this.viewListOfSpeakers.closed) {
            return this.listOfSpeakersRepo.update({ closed: true }, this.viewListOfSpeakers).catch(this.raiseError);
        }
    }

    /**
     * Opens the list of speaker for the current item
     */
    public openSpeakerList(): Promise<void> {
        if (this.viewListOfSpeakers.closed) {
            return this.listOfSpeakersRepo.update({ closed: false }, this.viewListOfSpeakers).catch(this.raiseError);
        }
    }

    /**
     * Clears the speaker list by removing all current, past and future speakers
     * after a confirmation dialog
     */
    public async clearSpeakerList(): Promise<void> {
        const title = this.translate.instant(
            'Are you sure you want to delete all speakers from this list of speakers?'
        );
        if (await this.promptService.open(title)) {
            this.listOfSpeakersRepo.deleteAllSpeakers(this.viewListOfSpeakers);
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
        return `${this.durationService.durationToString(duration, 'm')}`;
    }

    /**
     * Imports a new user by the given username.
     *
     * @param username The name of the new user.
     */
    public onCreateUser(username: string): void {
        this.userRepository.createFromString(username).then(result => {
            this.addNewSpeaker(result.id);
        });
    }
    /**
     * Triggers an update of the filter for the list of available potential speakers
     * (triggered on an update of users or config)
     */
    private filterUsers(): void {
        const presentUsersOnly = this.config.instant('agenda_present_speakers_only');
        const users = presentUsersOnly ? this.users.getValue().filter(u => u.is_present) : this.users.getValue();
        if (!this.speakers || !this.speakers.length) {
            this.filteredUsers.next(users);
        } else {
            this.filteredUsers.next(users.filter(u => !this.speakers.some(speaker => speaker.user_id === u.id)));
        }
    }

    /**
     * send the current order of the sorting list to the server
     *
     * @param sortedSpeakerList The list to save.
     */
    private onSaveSorting(sortedSpeakerList: Selectable[]): void {
        if (this.isSortMode) {
            this.listOfSpeakersRepo
                .sortSpeakers(
                    this.viewListOfSpeakers,
                    sortedSpeakerList.map(el => el.id)
                )
                .catch(this.raiseError);
        }
    }

    /**
     * Check, that the sorting mode is immediately active, if not in mobile-view.
     *
     * @param isMobile If currently a mobile device is used.
     */
    private checkSortMode(isMobile: boolean): void {
        this.isMobile = isMobile;
        this.isSortMode = !isMobile;
    }
}
