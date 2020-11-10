import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import { CollectionStringMapperService } from 'app/core/core-services/collection-string-mapper.service';
import { ListOfSpeakersRepositoryService } from 'app/core/repositories/agenda/list-of-speakers-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ViewportService } from 'app/core/ui-services/viewport.service';
import { ListOfSpeakersContentComponent } from 'app/shared/components/list-of-speakers-content/list-of-speakers-content.component';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewProjector } from 'app/site/projector/models/view-projector';
import { CurrentListOfSpeakersSlideService } from 'app/site/projector/services/current-list-of-speakers-slide.service';
import { CurrentListOfSpeakersService } from 'app/site/projector/services/current-list-of-speakers.service';
import { ViewListOfSpeakers } from '../../models/view-list-of-speakers';

/**
 * The list of speakers for agenda items.
 */
@Component({
    selector: 'os-list-of-speakers',
    templateUrl: './list-of-speakers.component.html',
    styleUrls: ['./list-of-speakers.component.scss']
})
export class ListOfSpeakersComponent extends BaseViewComponentDirective implements OnInit {
    @ViewChild('content')
    private listOfSpeakersContentComponent: ListOfSpeakersContentComponent;

    /**
     * Determine if the user is viewing the current list if speakers
     */
    public isCurrentListOfSpeakers = false;

    /**
     * Holds the view item to the given topic
     */
    public viewListOfSpeakers: ViewListOfSpeakers;

    /**
     * Holds a list of projectors. Only in CurrentListOfSpeakers mode
     */
    public projectors: ViewProjector[];

    /**
     * @returns true if the list of speakers list is currently closed
     */
    public get isListOfSpeakersClosed(): boolean {
        return this.viewListOfSpeakers && this.viewListOfSpeakers.closed;
    }

    public isMobile: boolean;

    public manualSortMode = false;

    /**
     * filled by child component
     */
    public isListOfSpeakersEmpty: boolean;

    /**
     * filled by child component
     */
    public canReaddLastSpeaker: boolean;

    /**
     * Constructor for speaker list component. Generates the forms.
     *
     * @param title
     * @param translate
     * @param snackBar
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
        private route: ActivatedRoute,
        private listOfSpeakersRepo: ListOfSpeakersRepositoryService,
        private promptService: PromptService,
        private currentListOfSpeakersService: CurrentListOfSpeakersService,
        private collectionStringMapper: CollectionStringMapperService,
        private currentListOfSpeakersSlideService: CurrentListOfSpeakersSlideService,
        private viewport: ViewportService
    ) {
        super(title, translate, snackBar);
    }

    public ngOnInit(): void {
        // Check, if we are on the current list of speakers.
        this.isCurrentListOfSpeakers =
            this.route.snapshot.url.length > 0
                ? this.route.snapshot.url[this.route.snapshot.url.length - 1].path === 'speakers'
                : true;

        if (this.isCurrentListOfSpeakers) {
            this.subscriptions.push(
                this.currentListOfSpeakersService.currentListOfSpeakersObservable.subscribe(clos => {
                    this.setListOfSpeakers(clos);
                })
            );
        } else {
            const id = +this.route.snapshot.url[this.route.snapshot.url.length - 1].path;
            this.setListOfSpeakersById(id);
        }

        this.subscriptions.push(this.viewport.isMobileSubject.subscribe(isMobile => (this.isMobile = isMobile)));
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
    private setListOfSpeakersById(id: number): void {
        this.subscriptions.push(
            this.listOfSpeakersRepo.getViewModelObservable(id).subscribe(listOfSpeakers => {
                if (listOfSpeakers) {
                    this.setListOfSpeakers(listOfSpeakers);
                }
            })
        );
    }

    private setListOfSpeakers(listOfSpeakers: ViewListOfSpeakers): void {
        const title = this.isCurrentListOfSpeakers
            ? 'Current list of speakers'
            : listOfSpeakers.getTitle() + ` - ${this.translate.instant('List of speakers')}`;
        super.setTitle(title);
        this.viewListOfSpeakers = listOfSpeakers;
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

    public setManualSortMode(active: boolean): void {
        this.manualSortMode = active;
    }

    /**
     * Saves sorting on mobile devices.
     */
    public async onMobileSaveSorting(): Promise<void> {
        await this.listOfSpeakersContentComponent.onSaveSorting();
        this.manualSortMode = false;
    }

    /**
     * Removes the last finished speaker from the list an re-adds him on pole position
     */
    public readdLastSpeaker(): void {
        this.listOfSpeakersRepo.readdLastSpeaker(this.viewListOfSpeakers).catch(this.raiseError);
    }

    public async setOpenness(open: boolean): Promise<void> {
        await this.listOfSpeakersRepo.setListOpenness(this.viewListOfSpeakers, open).catch(this.raiseError);
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
}
