import { Injectable } from '@angular/core';

import { OpenSlidesComponent } from 'app/openslides.component';
import { HttpService } from './http.service';
import { environment } from 'environments/environment.prod';
import { isNumber } from 'util';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ServertimeService extends OpenSlidesComponent {
    private static FAILURE_TIMEOUT = 30;
    private static NORMAL_TIMEOUT = 60 * 5;

    /**
     * In milliseconds
     */
    private serverOffsetSubject = new BehaviorSubject<number>(0);

    public constructor(private http: HttpService) {
        super();
    }

    public startScheduler(): void {
        this.scheduleNextRefresh(0);
    }

    public getServerOffsetObservable(): Observable<number> {
        return this.serverOffsetSubject.asObservable();
    }

    private scheduleNextRefresh(seconds: number): void {
        setTimeout(async () => {
            let timeout = ServertimeService.NORMAL_TIMEOUT;
            try {
                await this.refreshServertime();
            } catch (e) {
                console.log(e);
                timeout = ServertimeService.FAILURE_TIMEOUT;
            }
            this.scheduleNextRefresh(timeout);
        }, 1000 * seconds);
    }

    private async refreshServertime(): Promise<void> {
        // servertime is the time in seconds.
        const servertime = await this.http.get<number>(environment.urlPrefix + '/core/servertime/');
        if (!isNumber(servertime)) {
            throw new Error('The returned servertime is not a number');
        }
        this.serverOffsetSubject.next(Math.floor(Date.now() - servertime * 1000));
    }

    public getServertime(): number {
        return Date.now() - this.serverOffsetSubject.getValue();
    }
}
