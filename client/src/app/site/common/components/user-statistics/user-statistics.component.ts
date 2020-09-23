import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition } from '@pebula/ngrid/lib/grid';
import { BehaviorSubject, Observable } from 'rxjs';

import {
    ListOfSpeakersRepositoryService,
    SpeakingTimeStructureLevelObject
} from 'app/core/repositories/agenda/list-of-speakers-repository.service';
import { DurationService } from 'app/core/ui-services/duration.service';
import { ViewSpeaker } from 'app/site/agenda/models/view-speaker';
import { BaseViewComponentDirective } from 'app/site/base/base-view';

@Component({
    selector: 'os-user-statistics',
    templateUrl: './user-statistics.component.html',
    styleUrls: ['./user-statistics.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class UserStatisticsComponent extends BaseViewComponentDirective {
    /**
     * Returns the total duration for a whole assembly.
     */
    public get totalDuration(): string {
        return this.parseDuration(this.speakingTimeAsNumber, true);
    }

    public get numberOfUniqueSpeakers(): number {
        return this.uniqueSpeakers.length;
    }

    public get numberOfWordRequests(): number {
        return this._numberOfWordRequests;
    }

    /**
     * Returns an observable containing a list. This list contains objects separated by the structure-level of speakers.
     *
     * Those objects hold information about number and duration of requests to speak for a given
     * structure-level.
     */
    public get statisticsByStructureLevelObservable(): Observable<SpeakingTimeStructureLevelObject[]> {
        return this.relationSpeakingTimeStructureLevelSubject.asObservable();
    }

    /**
     * Dedicated, if statistics are opened.
     */
    public get openedStatistics(): boolean {
        return this.statisticIsOpen;
    }

    public readonly columnDefinition: PblColumnDefinition[] = [
        {
            prop: 'structureLevel',
            width: 'auto',
            label: 'Structure level'
        },
        {
            prop: 'durationOfWordRequests',
            width: 'auto',
            label: this.translate.instant('Duration of requests to speak')
        },
        {
            prop: 'numberOfWordRequests',
            width: 'auto',
            label: this.translate.instant('Number of requests to speak')
        }
    ];

    public readonly filterProps: string[] = ['structureLevel'];

    /**
     * Holds information about hours, minutes and seconds for the total duration of requests to speak.
     */
    private speakingTimeAsNumber = 0;

    /**
     * List of unique speakers.
     */
    private uniqueSpeakers: ViewSpeaker[] = [];
    private _numberOfWordRequests = 0;
    private statisticIsOpen = false;
    private relationSpeakingTimeStructureLevelSubject = new BehaviorSubject<SpeakingTimeStructureLevelObject[]>([]);

    public constructor(
        title: Title,
        protected translate: TranslateService,
        matSnackBar: MatSnackBar,
        private losRepo: ListOfSpeakersRepositoryService,
        private durationService: DurationService
    ) {
        super(title, translate, matSnackBar);
    }

    /**
     * Opens or closes statistics.
     */
    public changeViewOfStatistics(): void {
        this.statisticIsOpen = !this.statisticIsOpen;
        if (this.statisticIsOpen) {
            this.startSubscription();
        } else {
            this.cleanSubjects();
        }
    }

    /**
     * This iterates over a list of list-of-speakers. For each speaker it calculates the duration the speaker
     * has spoken.
     */
    private pushNextState(): void {
        const list = this.losRepo.getSpeakingTimeStructureLevelRelation();
        list.sort((a, b) => b.finishedSpeakers.length - a.finishedSpeakers.length);
        for (const entry of list) {
            this.speakingTimeAsNumber += entry.speakingTime;
            this._numberOfWordRequests += entry.finishedSpeakers.length;
        }
        this.relationSpeakingTimeStructureLevelSubject.next(list);
        this.uniqueSpeakers = this.losRepo.getAllFirstContributions();
    }

    /**
     * Creates a string from a given `TimeObject`.
     */
    public parseDuration(time: number, withHours: boolean = false): string {
        return !withHours
            ? this.durationService.durationToString(time, 'm')
            : this.durationService.durationToStringWithHours(time);
    }

    private startSubscription(): void {
        this.subscriptions.push(
            this.losRepo.getViewModelListObservable().subscribe(() => {
                this.reset();
                this.pushNextState();
            })
        );
    }

    private reset(): void {
        this._numberOfWordRequests = 0;
        this.speakingTimeAsNumber = 0;
    }
}
