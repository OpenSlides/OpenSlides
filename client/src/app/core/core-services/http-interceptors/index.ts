import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { StableInterceptorService } from './stable-interceptor.service';

export const httpInterceptorProviders = [
    { provide: HTTP_INTERCEPTORS, useClass: StableInterceptorService, multi: true }
];
