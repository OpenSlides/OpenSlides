import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { NoopInterceptorService } from './noop-interceptor.service';

export const httpInterceptorProviders = [{ provide: HTTP_INTERCEPTORS, useClass: NoopInterceptorService, multi: true }];
