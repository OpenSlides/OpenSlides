import { Injectable } from '@angular/core';

import { Alert, AlertType } from 'app/core/models/alert';

/**TODO Drafted for now. Since the UI is not done yet, this might be replaced or disappear entirely.
 * Furtermore, Material UI does not support these kinds of alerts
 */

@Injectable({
    providedIn: 'root'
})
export class AlertService {
    constructor() {}

    success(message: string): Alert {
        return this.alert(AlertType.Success, message);
    }

    error(message: string): Alert {
        // console.log('this.alert : ', this.alert());
        // this.alert(AlertType.Error, message);
        return this.alert(AlertType.Error, message);
    }

    info(message: string): Alert {
        return this.alert(AlertType.Info, message);
    }

    warn(message: string): Alert {
        return this.alert(AlertType.Warning, message);
    }

    alert(type: AlertType, message: string): Alert {
        return <Alert>{ type: type, message: message };
    }

    // TODO fromHttpError() to generate alerts form http errors
}
