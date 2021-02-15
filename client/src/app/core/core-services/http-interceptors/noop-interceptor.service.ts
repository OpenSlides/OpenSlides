import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, Subject } from 'rxjs';
import { first, mergeMap } from 'rxjs/operators';

import { StableService } from '../stable.service';

@Injectable({
    providedIn: 'root'
})
export class NoopInterceptorService implements HttpInterceptor {
    public constructor(private openslidesService: StableService) {}
    public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return this.openslidesService.booted.pipe(
            first(stable => stable),
            mergeMap(() => {
                return next.handle(req);
            })
        );
    }
}
