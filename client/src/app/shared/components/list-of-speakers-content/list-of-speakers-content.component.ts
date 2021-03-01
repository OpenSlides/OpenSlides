import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

import { OperatorService } from 'app/core/core-services/operator.service';
import { ListOfSpeakersRepositoryService } from 'app/core/repositories/agenda/list-of-speakers-repository.service';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { DurationService } from 'app/core/ui-services/duration.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ViewportService } from 'app/core/ui-services/viewport.service';
import { ViewListOfSpeakers } from 'app/site/agenda/models/view-list-of-speakers';
import { SpeakerState, ViewSpeaker } from 'app/site/agenda/models/view-speaker';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { ViewUser } from 'app/site/users/models/view-user';
import { Selectable } from '../selectable';
import { SortingListComponent } from '../sorting-list/sorting-list.component';

@Component({
    selector: 'os-list-of-speakers-content',
    templateUrl: './list-of-speakers-content.component.html',
    styleUrls: ['./list-of-speakers-content.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListOfSpeakersContentComponent extends BaseViewComponentDirective implements OnInit {
    @ViewChild(SortingListComponent)
    public listElement: SortingListComponent;

    private viewListOfSpeakers: ViewListOfSpeakers;
    public finishedSpeakers: ViewSpeaker[];
    public waitingSpeakers: ViewSpeaker[];
    public activeSpeaker: ViewSpeaker;

    /**
     * Required for the user search selector
     */
    public addSpeakerForm: FormGroup;

    public users = new BehaviorSubject<ViewUser[]>([]);
    public filteredUsers = new BehaviorSubject<ViewUser[]>([]);

    public isSortMode: boolean;

    public isMobile: boolean;

    public showFistContributionHint: boolean;

    public get showPointOfOrders(): boolean {
        return this.pointOfOrderEnabled && this.canAddDueToPresence;
    }

    private pointOfOrderEnabled: boolean;

    public get title(): string {
        return this.viewListOfSpeakers?.getTitle();
    }

    public get closed(): boolean {
        return this.viewListOfSpeakers?.closed;
    }

    public get opCanManage(): boolean {
        return this.operator.hasPerms(this.permission.agendaCanManageListOfSpeakers);
    }

    public get canAddDueToPresence(): boolean {
        return !this.config.instant('agenda_present_speakers_only') || this.operator.user.is_present;
    }

    @Input()
    public set speakers(los: ViewListOfSpeakers) {
        this.setListOfSpeakers(los);
    }

    @Input()
    public customTitle: boolean;

    @Input()
    public set sortMode(isActive: boolean) {
        if (this.isSortMode) {
            this.listElement.restore();
        }
        this.isSortMode = isActive;
    }

    @Output()
    private isListOfSpeakersEmptyEvent = new EventEmitter<boolean>();

    @Output()
    private canReaddLastSpeakerEvent = new EventEmitter<boolean>();

    public constructor(
        title: Title,
        protected translate: TranslateService,
        snackBar: MatSnackBar,
        private listOfSpeakersRepo: ListOfSpeakersRepositoryService,
        private operator: OperatorService,
        private promptService: PromptService,
        private durationService: DurationService,
        private userRepository: UserRepositoryService,
        private config: ConfigService,
        private viewport: ViewportService,
        private cd: ChangeDetectorRef
    ) {
        super(title, translate, snackBar);
        this.addSpeakerForm = new FormGroup({ user_id: new FormControl() });
    }

    public ngOnInit(): void {
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
                    this.addUserAsNewSpeaker(formResult.user_id);
                }
            }),
            // observe changes to the viewport
            this.viewport.isMobileSubject.subscribe(isMobile => {
                this.isMobile = isMobile;
                this.cd.markForCheck();
            }),
            // observe changes the agenda_present_speakers_only config
            this.config.get('agenda_present_speakers_only').subscribe(() => {
                this.filterUsers();
            }),
            // observe changes to the agenda_show_first_contribution config
            this.config.get<boolean>('agenda_show_first_contribution').subscribe(show => {
                this.showFistContributionHint = show;
            }),
            // observe point of order settings
            this.config.get<boolean>('agenda_enable_point_of_order_speakers').subscribe(enabled => {
                this.pointOfOrderEnabled = enabled;
            })
        );
    }

    private isListOfSpeakersEmpty(): void {
        if (this.waitingSpeakers?.length || this.finishedSpeakers?.length) {
            this.isListOfSpeakersEmptyEvent.emit(false);
        } else {
            return this.isListOfSpeakersEmptyEvent.emit(!this.activeSpeaker);
        }
    }

    private updateCanReaddLastSpeaker(): void {
        let canReaddLast;
        if (this.finishedSpeakers?.length > 0) {
            const lastSpeaker = this.finishedSpeakers[this.finishedSpeakers.length - 1];
            const isLastSpeakerWaiting = this.waitingSpeakers.some(speaker => speaker.user_id === lastSpeaker.user_id);
            canReaddLast = !lastSpeaker.point_of_order && !isLastSpeakerWaiting;
        } else {
            canReaddLast = false;
        }
        this.canReaddLastSpeakerEvent.emit(canReaddLast);
    }

    /**
     * Create a speaker out of an id
     *
     * @param userId the user id to add to the list. No parameter adds the operators user as speaker.
     */
    public async addUserAsNewSpeaker(userId?: number): Promise<void> {
        try {
            await this.listOfSpeakersRepo.createSpeaker(this.viewListOfSpeakers, userId);
            this.addSpeakerForm.reset();
        } catch (e) {
            this.raiseError(e);
        }
    }

    /**
     * Click on the X button - removes the speaker from the list of speakers
     *
     * @param speaker optional speaker to remove. If none is given,
     * the operator themself is removed
     */
    public async removeSpeaker(speaker?: ViewSpeaker): Promise<void> {
        const title = speaker
            ? this.translate.instant('Are you sure you want to remove this speaker from the list of speakers?')
            : this.translate.instant('Are you sure you want to remove yourself from this list of speakers?');
        if (await this.promptService.open(title)) {
            try {
                await this.listOfSpeakersRepo.deleteSpeaker(this.viewListOfSpeakers, speaker ? speaker.id : null);
                this.filterUsers();
            } catch (e) {
                this.raiseError(e);
            }
        }
    }

    public async addPointOfOrder(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to submit a point of order?');
        if (await this.promptService.open(title)) {
            try {
                await this.listOfSpeakersRepo.createSpeaker(this.viewListOfSpeakers, undefined, true);
            } catch (e) {
                this.raiseError(e);
            }
        }
    }

    public removePointOfOrder(): void {
        this.listOfSpeakersRepo.deleteSpeaker(this.viewListOfSpeakers, undefined, true).catch(this.raiseError);
    }

    public isOpInWaitlist(pointOfOrder: boolean = false): boolean {
        if (!this.waitingSpeakers) {
            return false;
        }
        return this.waitingSpeakers.some(
            speaker => speaker.user_id === this.operator.user.id && speaker.point_of_order === pointOfOrder
        );
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
     * Click on the mic-cross button to stop the current speaker
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
     * Receives an updated list from sorting-event.
     *
     * @param sortedSpeakerList The updated list.
     */
    public onSortingChanged(sortedSpeakerList: Selectable[]): void {
        if (!this.isMobile) {
            this.onSaveSorting(sortedSpeakerList);
        }
    }

    /**
     * send the current order of the sorting list to the server
     *
     * @param sortedSpeakerList The list to save.
     */
    public async onSaveSorting(sortedSpeakerList: Selectable[] = this.listElement.sortedItems): Promise<void> {
        return await this.listOfSpeakersRepo
            .sortSpeakers(
                this.viewListOfSpeakers,
                sortedSpeakerList.map(el => el.id)
            )
            .catch(this.raiseError);
    }

    private setListOfSpeakers(viewListOfSpeakers: ViewListOfSpeakers | undefined): void {
        this.viewListOfSpeakers = viewListOfSpeakers;
        const allSpeakers = viewListOfSpeakers?.speakers.sort((a, b) => a.weight - b.weight);
        this.waitingSpeakers = allSpeakers?.filter(speaker => speaker.state === SpeakerState.WAITING);
        this.waitingSpeakers?.sort((a: ViewSpeaker, b: ViewSpeaker) => a.weight - b.weight);
        this.filterUsers();
        this.finishedSpeakers = allSpeakers?.filter(speaker => speaker.state === SpeakerState.FINISHED);

        // convert begin time to date and sort
        this.finishedSpeakers?.sort((a: ViewSpeaker, b: ViewSpeaker) => {
            const aTime = new Date(a.begin_time).getTime();
            const bTime = new Date(b.begin_time).getTime();
            return aTime - bTime;
        });

        this.activeSpeaker = allSpeakers?.find(speaker => speaker.state === SpeakerState.CURRENT);
        this.updateCanReaddLastSpeaker();
        this.isListOfSpeakersEmpty();
    }

    /**
     * Triggers an update of the filter for the list of available potential speakers
     * (triggered on an update of users or config)
     */
    private filterUsers(): void {
        const presentUsersOnly = this.config.instant('agenda_present_speakers_only');
        const users = presentUsersOnly ? this.users.getValue().filter(u => u.is_present) : this.users.getValue();
        if (!this.waitingSpeakers || !this.waitingSpeakers.length) {
            this.filteredUsers.next(users);
        } else {
            this.filteredUsers.next(users.filter(u => !this.waitingSpeakers.some(speaker => speaker.user_id === u.id)));
        }
    }

    /**
     * Imports a new user by the given username.
     *
     * @param username The name of the new user.
     */
    public async onCreateUser(username: string): Promise<void> {
        const newUser = await this.userRepository.createFromString(username);
        this.addUserAsNewSpeaker(newUser.id);
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
     * returns a locale-specific version of the starting time for the given speaker item
     *
     * @param speaker
     * @returns a time string using the current language setting of the client
     */
    public startTimeToString(speaker: ViewSpeaker): string {
        return new Date(speaker.begin_time).toLocaleString(this.translate.currentLang);
    }
}
