import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { CountUserData, CountUsersService } from 'app/core/ui-services/count-users.service';

/**
 * The format of the count statistic
 */
export interface CountUserStatistics {
    activeUserHandles: number;
    activeUsers: {
        [id: number]: number;
    };
    groups: {
        [id: number]: {
            name: string;
            users: {
                [id: number]: number;
            };
            userHandleCount: number;
        };
    };
}

/**
 * Provides statistics for counting users
 */
@Injectable({
    providedIn: 'root'
})
export class CountUsersStatisticsService {
    private runningCounts: { [token: string]: BehaviorSubject<CountUserStatistics> } = {};

    public constructor(private countUserService: CountUsersService, private userRepo: UserRepositoryService) {}

    /**
     * Starts counting users.
     *
     * @returns a 2-tuple: A token to stop the counting with `stopCounting` and
     * an observable where the statistics are published.
     */
    public countUsers(): [string, Observable<CountUserStatistics>] {
        let token: string;
        let userDataObservable: Observable<CountUserData>;

        // Start counting
        // TODO: maybe we shold bet the observable bofore the actual countig was
        // started. We might miss some user ids.
        [token, userDataObservable] = this.countUserService.countUsers();
        this.runningCounts[token] = new BehaviorSubject<CountUserStatistics>({
            activeUserHandles: 0,
            activeUsers: {},
            groups: {}
        });

        // subscribe to responses
        userDataObservable.subscribe(data => {
            const userId = !!data.userId ? data.userId : 0;

            const stats = this.runningCounts[token].getValue();
            const user = this.userRepo.getViewModel(userId);

            // Add to user stats
            stats.activeUserHandles++;
            if (!stats.activeUsers[userId]) {
                stats.activeUsers[userId] = 0;
            }
            stats.activeUsers[userId]++;

            // Add to group stats
            const groups = user ? user.groups : [];
            groups.forEach(group => {
                if (!stats.groups[group.id]) {
                    stats.groups[group.id] = {
                        name: group.name,
                        users: {},
                        userHandleCount: 0
                    };
                }
                stats.groups[group.id].userHandleCount++;
                stats.groups[group.id].users[userId] = stats.activeUsers[userId];
            });
            this.runningCounts[token].next(stats);
        });

        return [token, this.runningCounts[token].asObservable()];
    }

    /**
     * Stop an active count.
     *
     * @param token The token to identify the current count
     */
    public stopCounting(token: string): void {
        if (this.runningCounts[token]) {
            this.runningCounts[token].complete();
            delete this.runningCounts[token];
        }
    }
}
