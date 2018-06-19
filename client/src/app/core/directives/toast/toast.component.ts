import { Component, OnInit } from '@angular/core';

import { Alert, AlertType } from 'app/core/models/alert';
import { ToastService } from 'app/core/services/toast.service';

@Component({
    selector: 'app-toast',
    templateUrl: './toast.component.html',
    styleUrls: ['./toast.component.css']
})
export class ToastComponent implements OnInit {
    toasts: Alert[] = [];

    constructor(private toastService: ToastService) {}

    ngOnInit() {
        this.toastService.getToast().subscribe((alert: Alert) => {
            if (!alert) {
                // clear alerts when an empty alert is received
                this.toasts = [];
                return;
            }

            // add alert to array
            this.toasts.push(alert);
        });
    }

    removeAlert(alert: Alert) {
        this.toasts = this.toasts.filter(x => x !== alert);
    }

    cssClass(alert: Alert) {
        if (!alert) {
            return;
        }

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
