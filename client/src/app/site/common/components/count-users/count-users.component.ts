import { Component, OnDestroy } from '@angular/core';

import { Observable } from 'rxjs';
import { auditTime } from 'rxjs/operators';

import { CountUsersStatisticsService, CountUserStatistics } from '../../services/count-user-statistics.service';

/**
 * This component provides an interface to count users
 */
@Component({
    selector: 'os-count-users',
    templateUrl: './count-users.component.html'
})
export class CountUsersComponent implements OnDestroy {
    public token: string = null;
    public stats: CountUserStatistics = null;

    public constructor(private countUsersStatisticService: CountUsersStatisticsService) {}

    public countUsers(): void {
        if (this.token) {
            return;
        }
        let statsObservable: Observable<CountUserStatistics>;
        [this.token, statsObservable] = this.countUsersStatisticService.countUsers();
        statsObservable.pipe(auditTime(100)).subscribe(stats => {
            this.stats = stats;
        });
    }

    public stopCounting(): void {
        if (this.token) {
            this.countUsersStatisticService.stopCounting(this.token);
            this.token = null;
            this.stats = null;
        }
    }

    public userIds(): number[] {
        return Object.keys(this.stats.activeUsers).map(id => +id);
    }

    public groupIds(): number[] {
        return Object.keys(this.stats.groups).map(id => +id);
    }

    public userInGroupIds(groupId: number): number[] {
        return Object.keys(this.stats.groups[groupId].users).map(id => +id);
    }

    public ngOnDestroy(): void {
        this.stopCounting();
    }
}
