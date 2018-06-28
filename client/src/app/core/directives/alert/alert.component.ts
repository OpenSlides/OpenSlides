import { Component, OnInit, Input } from '@angular/core';

import { Alert, AlertType } from 'app/core/models/alert';

/**TODO Drafted for now. Since the UI is not done yet, this might be replaced or disappear entirely.
 * Furtermore, Material UI does not support these kinds of alerts
 */

@Component({
    selector: 'app-alert',
    templateUrl: './alert.component.html',
    styleUrls: ['./alert.component.css']
})
export class AlertComponent implements OnInit {
    @Input() alert: Alert;

    constructor() {}

    ngOnInit() {}

    removeAlert(alert: Alert) {
        this.alert = undefined;
    }

    cssClass(alert: Alert) {
        // return css class based on alert type
        switch (alert.type) {
            case AlertType.Success:
                return 'alert alert-success';
            case AlertType.Error:
                return 'alert alert-danger';
            case AlertType.Info:
                return 'alert alert-info';
            case AlertType.Warning:
                return 'alert alert-warning';
        }
    }
}
