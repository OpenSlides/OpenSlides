import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import {
    ProjectorRepositoryService,
    ScrollScaleDirection
} from 'app/core/repositories/projector/projector-repository.service';
import { ViewProjector } from '../../models/view-projector';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ProjectorService } from 'app/core/core-services/projector.service';
import { moveItemInArray, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ProjectorElement } from 'app/shared/models/core/projector';
import { SlideManager } from 'app/slides/services/slide-manager.service';
import { CountdownRepositoryService } from 'app/core/repositories/projector/countdown-repository.service';
import { ProjectorMessageRepositoryService } from 'app/core/repositories/projector/projector-message-repository.service';
import { ViewProjectorMessage } from 'app/site/projector/models/view-projector-message';
import { ViewCountdown } from 'app/site/projector/models/view-countdown';
import { Projectable } from 'app/site/base/projectable';
import { CurrentListOfSpeakersSlideService } from '../../services/current-list-of-of-speakers-slide.service';
import { CurrentSpeakerChyronSlideService } from '../../services/current-speaker-chyron-slide.service';

/**
 * The projector detail view.
 */
@Component({
    selector: 'os-projector-detail',
    templateUrl: './projector-detail.component.html',
    styleUrls: ['./projector-detail.component.scss']
})
export class ProjectorDetailComponent extends BaseViewComponent implements OnInit {
    /**
     * The projector to show.
     */
    public projector: ViewProjector;

    public scrollScaleDirection = ScrollScaleDirection;

    public countdowns: ViewCountdown[] = [];

    public messages: ViewProjectorMessage[] = [];

    public projectorCount: number;

    /**
     * true if the queue might be altered
     */
    public editQueue = false;

    /**
     * @param titleService
     * @param translate
     * @param matSnackBar
     * @param repo
     * @param route
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private repo: ProjectorRepositoryService,
        private route: ActivatedRoute,
        private projectorService: ProjectorService,
        private slideManager: SlideManager,
        private countdownRepo: CountdownRepositoryService,
        private messageRepo: ProjectorMessageRepositoryService,
        private currentListOfSpeakersSlideService: CurrentListOfSpeakersSlideService,
        private currentSpeakerChyronService: CurrentSpeakerChyronSlideService
    ) {
        super(titleService, translate, matSnackBar);

        this.countdownRepo.getViewModelListObservable().subscribe(countdowns => (this.countdowns = countdowns));
        this.messageRepo.getViewModelListObservable().subscribe(messages => (this.messages = messages));
        this.repo.getViewModelListObservable().subscribe(projectors => (this.projectorCount = projectors.length));
    }

    /**
     * Gets the projector and subscribes to it.
     */
    public ngOnInit(): void {
        super.setTitle('Projector');
        this.route.params.subscribe(params => {
            const projectorId = parseInt(params.id, 10) || 1;
            this.repo.getViewModelObservable(projectorId).subscribe(projector => (this.projector = projector));
        });
    }

    /**
     * Change the scroll
     *
     * @param direction The direction to send.
     * @param step (optional) The amount of steps to make.
     */
    public scroll(direction: ScrollScaleDirection, step: number = 1): void {
        this.repo.scroll(this.projector, direction, step).then(null, this.raiseError);
    }

    /**
     * Change the scale
     *
     * @param direction The direction to send.
     * @param step (optional) The amount of steps to make.
     */
    public scale(direction: ScrollScaleDirection, step: number = 1): void {
        this.repo.scale(this.projector, direction, step).then(null, this.raiseError);
    }

    public projectNextSlide(): void {
        this.projectorService.projectNextSlide(this.projector.projector).then(null, this.raiseError);
    }

    public projectPreviousSlide(): void {
        this.projectorService.projectPreviousSlide(this.projector.projector).then(null, this.raiseError);
    }

    public onSortingChange(event: CdkDragDrop<ProjectorElement>): void {
        moveItemInArray(this.projector.elements_preview, event.previousIndex, event.currentIndex);
        this.projectorService.savePreview(this.projector.projector).then(null, this.raiseError);
    }

    public removePreviewElement(elementIndex: number): void {
        this.projector.elements_preview.splice(elementIndex, 1);
        this.projectorService.savePreview(this.projector.projector).then(null, this.raiseError);
    }

    public projectNow(elementIndex: number): void {
        this.projectorService.projectPreviewSlide(this.projector.projector, elementIndex).then(null, this.raiseError);
    }

    public getSlideTitle(element: ProjectorElement): string {
        return this.projectorService.getSlideTitle(element);
    }

    public isProjected(obj: Projectable): boolean {
        return this.projectorService.isProjectedOn(obj, this.projector.projector);
    }

    public async project(obj: Projectable): Promise<void> {
        try {
            if (this.isProjected(obj)) {
                await this.projectorService.removeFrom(this.projector.projector, obj);
            } else {
                await this.projectorService.projectOn(this.projector.projector, obj);
            }
        } catch (e) {
            this.raiseError(e);
        }
    }

    public unprojectCurrent(element: ProjectorElement): void {
        const idElement = this.slideManager.getIdentifialbeProjectorElement(element);
        this.projectorService.removeFrom(this.projector.projector, idElement).then(null, this.raiseError);
    }

    public isClosProjected(stable: boolean): boolean {
        return this.currentListOfSpeakersSlideService.isProjectedOn(this.projector, stable);
    }

    public toggleClos(stable: boolean): void {
        this.currentListOfSpeakersSlideService.toggleOn(this.projector, stable);
    }

    public isChyronProjected(): boolean {
        return this.currentSpeakerChyronService.isProjectedOn(this.projector);
    }

    public toggleChyron(): void {
        this.currentSpeakerChyronService.toggleOn(this.projector);
    }
}
