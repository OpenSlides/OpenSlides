import { Injectable } from '@angular/core';

import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';

import { ConfigService } from './config.service';
import { HttpService } from '../core-services/http.service';
import { NotifyService } from '../core-services/notify.service';

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
    providedIn: 'root'
})
export class ApplauseService {
    private minApplauseLevel: number;
    private maxApplauseLevel: number;
    private presentApplauseUsers: number;

    public applauseType: ApplauseType;

    private applauseLevelSubject: Subject<number> = new Subject<number>();
    public applauseLevelObservable = this.applauseLevelSubject.asObservable();

    private get maxApplause(): number {
        return this.maxApplauseLevel || this.presentApplauseUsers || 0;
    }

    public constructor(
        configService: ConfigService,
        private httpService: HttpService,
        private notifyService: NotifyService
    ) {
        configService.get<number>('general_system_applause_min_amount').subscribe(minLevel => {
            this.minApplauseLevel = minLevel;
        });
        configService.get<number>('general_system_applause_max_amount').subscribe(maxLevel => {
            this.maxApplauseLevel = maxLevel;
        });
        configService.get<ApplauseType>('general_system_applause_type').subscribe((type: ApplauseType) => {
            this.applauseType = type;
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
    }

    public getApplauseQuote(applauseLevel: number): number {
        if (!applauseLevel) {
            return 0;
        }
        const quote = applauseLevel / this.maxApplause || 0;
        return quote > 1 ? 1 : quote;
    }
}
