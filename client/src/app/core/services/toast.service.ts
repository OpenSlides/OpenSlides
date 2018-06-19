import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { Alert, AlertType } from 'app/core/models/alert';

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private subject = new Subject<Alert>();

    constructor() {}

    getToast(): Observable<any> {
        return this.subject.asObservable();
    }

    success(message: string) {
        this.alert(AlertType.Success, message);
    }

    error(message: string) {
        this.alert(AlertType.Error, message);
    }

    info(message: string) {
        this.alert(AlertType.Info, message);
    }

    warn(message: string) {
        this.alert(AlertType.Warning, message);
    }

    alert(type: AlertType, message: string) {
        this.subject.next(<Alert>{ type: type, message: message });
    }

    clear() {
        // clear alerts
        this.subject.next();
    }
}
