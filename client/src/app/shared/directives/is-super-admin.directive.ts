import { Directive, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';

import { Subscription } from 'rxjs';

import { OperatorService } from 'app/core/core-services/operator.service';

/**
 * Directive to check if the operator is a superadmin
 *
 * @example <div *osIsSuperadmin ..> ... < /div>
 */
@Directive({
    selector: '[osIsSuperAdmin]'
})
export class IsSuperAdminDirective implements OnInit, OnDestroy {
    /**
     * Holds the value of the last is superadmin check. Therefore one can check, if the
     * permission has changes, to save unnecessary view updates, if not.
     */
    private lastIsSuperAdminCheckResult = false;

    private operatorSubscription: Subscription | null;

    /**
     * Constructs the directive once. Observes the operator for it's groups so the
     * directive can perform changes dynamically
     *
     * @param template inner part of the HTML container
     * @param viewContainer outer part of the HTML container (for example a `<div>`)
     * @param operator OperatorService
     */
    public constructor(
        private template: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private operator: OperatorService
    ) {}

    public ngOnInit(): void {
        // observe groups of operator, so the directive can actively react to changes
        this.operatorSubscription = this.operator.getUserObservable().subscribe(() => {
            this.updateView();
        });
    }

    public ngOnDestroy(): void {
        if (this.operatorSubscription) {
            this.operatorSubscription.unsubscribe();
        }
    }

    /**
     * Shows or hides certain content in the view.
     */
    private updateView(): void {
        const isSuperadmin = this.operator.isSuperAdmin;
        const superADminChanged = isSuperadmin !== this.lastIsSuperAdminCheckResult;

        if (isSuperadmin && superADminChanged) {
            // clean up and add the template
            this.viewContainer.clear();
            this.viewContainer.createEmbeddedView(this.template);
        } else if (!isSuperadmin) {
            // will remove the content of the container
            this.viewContainer.clear();
        }
        this.lastIsSuperAdminCheckResult = isSuperadmin;
    }
}
