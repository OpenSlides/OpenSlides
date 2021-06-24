import { Injectable } from '@angular/core';

import { combineLatest, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';

import { ConfigService } from '../../../core/ui-services/config.service';
import { HttpService } from '../../../core/core-services/http.service';
import { NotifyService } from '../../../core/core-services/notify.service';

export interface Applause {
    level: number;
    presentUsers: number;
}

export enum ApplauseType {
    particles = 'applause-type-particles',
    bar = 'applause-type-bar'
}

const applausePath = '/system/applause';
const applauseNotifyMessageName = 'applause';

@Injectable({
    // providedIn: InteractionModule
    providedIn: 'root'
    // provided: InteractionModule
})
export class ApplauseService {
    private minApplauseLevel: number;
    private maxApplauseLevel: number;
    private presentApplauseUsers: number;
    private applauseTypeObservable: Observable<ApplauseType>;

    public applauseTimeoutObservable: Observable<number>;
    private applauseTimeout = 0;

    private sendsApplauseSubject: Subject<boolean> = new Subject<boolean>();
    public sendsApplauseObservable: Observable<boolean> = this.sendsApplauseSubject.asObservable();

    public showApplauseObservable: Observable<boolean>;
    private showApplauseLevelConfigObservable: Observable<boolean>;
    private applauseLevelSubject: Subject<number> = new Subject<number>();
    public applauseLevelObservable: Observable<number> = this.applauseLevelSubject.asObservable();

    private get maxApplause(): number {
        return this.maxApplauseLevel || this.presentApplauseUsers || 0;
    }

    public get showParticles(): Observable<boolean> {
        return this.applauseTypeObservable.pipe(map(type => type === ApplauseType.particles));
    }

    public get showBar(): Observable<boolean> {
        return this.applauseTypeObservable.pipe(map(type => type === ApplauseType.bar));
    }

    public get showApplauseLevelObservable(): Observable<boolean> {
        return combineLatest([this.showApplauseLevelConfigObservable, this.applauseLevelObservable]).pipe(
            map(([enabled, amount]) => {
                return enabled && amount > 0;
            })
        );
    }

    public constructor(
        configService: ConfigService,
        private httpService: HttpService,
        private notifyService: NotifyService
    ) {
        this.showApplauseObservable = configService.get<boolean>('general_system_applause_enable');
        this.applauseTypeObservable = configService.get<ApplauseType>('general_system_applause_type');
        this.showApplauseLevelConfigObservable = configService.get<boolean>('general_system_applause_show_level');

        this.applauseTimeoutObservable = configService
            .get<number>('general_system_stream_applause_timeout')
            .pipe(map(timeout => timeout * 1000));

        this.applauseTimeoutObservable.subscribe(timeout => {
            this.applauseTimeout = timeout;
        });

        configService.get<number>('general_system_applause_min_amount').subscribe(minLevel => {
            this.minApplauseLevel = minLevel;
        });
        configService.get<number>('general_system_applause_max_amount').subscribe(maxLevel => {
            this.maxApplauseLevel = maxLevel;
        });

        this.notifyService
            .getMessageObservable<Applause>(applauseNotifyMessageName)
            .pipe(
                map(notify => notify.message as Applause),
                /**
                 * only updates when the effective applause level changes
                 */
                distinctUntilChanged((prev, curr) => {
                    return prev.level === curr.level;
                }),
                filter(curr => {
                    return curr.level === 0 || curr.level >= this.minApplauseLevel;
                })
            )
            .subscribe(applause => {
                this.presentApplauseUsers = applause.presentUsers;
                this.applauseLevelSubject.next(applause.level);
            });
    }

    public async sendApplause(): Promise<void> {
        await this.httpService.post(applausePath);

        this.sendsApplauseSubject.next(true);
        setTimeout(() => {
            this.sendsApplauseSubject.next(false);
        }, this.applauseTimeout);
    }

    public getApplauseQuote(applauseLevel: number): number {
        if (!applauseLevel) {
            return 0;
        }
        const quote = applauseLevel / this.maxApplause || 0;
        return quote > 1 ? 1 : quote;
    }
}
