import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Interceptor class for HTTP requests. Replaces all 'httpOptions' in all http.get or http.post requests.
 *
 * Should not need further adjustment.
 */
export class AddHeaderInterceptor implements HttpInterceptor {
    /**
     * Normal HttpInterceptor usage
     *
     * @param req Will clone the request and intercept it with our desired headers
     * @param next HttpHandler will catch the response and forwards it to the original instance
     */
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const clonedRequest = req.clone({
            withCredentials: true,
            headers: req.headers.set('Content-Type', 'application/json')
        });

        return next.handle(clonedRequest);
    }
}
