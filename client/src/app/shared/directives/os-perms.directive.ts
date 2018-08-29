import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

import { OperatorService, Permission } from 'app/core/services/operator.service';
import { OpenSlidesComponent } from 'app/openslides.component';

/**
 * Directive to check if the {@link OperatorService} has the correct permissions to access certain functions
 *
 * Successor of os-perms in OpenSlides 2.2
 * @example <div *appOsPerms="'perm'" ..> ... < /div>
 * @example <div *appOsPerms="['perm1', 'perm2']" ..> ... < /div>
 */
@Directive({
    selector: '[appOsPerms]'
})
export class OsPermsDirective extends OpenSlidesComponent {
    /**
     * Holds the required permissions the access a feature
     */
    private permissions: Permission[] = [];

    /**
     * Holds the value of the last permission check. Therefore one can check, if the
     * permission has changes, to save unnecessary view updates, if not.
     */
    private lastPermissionCheckResult = false;

    /**
     * Constructs the directive once. Observes the operator for it's groups so the
     * directive can perform changes dynamically
     *
     * @param template inner part of the HTML container
     * @param viewContainer outer part of the HTML container (for example a `<div>`)
     * @param operator OperatorService
     */
    constructor(
        private template: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private operator: OperatorService
    ) {
        super();

        // observe groups of operator, so the directive can actively react to changes
        this.operator.getObservable().subscribe(content => {
            this.updateView();
        });
    }

    /**
     * Comes directly from the view.
     * The value defines the requires permissions as an array or a single permission.
     */
    @Input()
    set appOsPerms(value) {
        if (!value) {
            value = [];
        } else if (typeof value === 'string') {
            value = [value];
        }
        this.permissions = value;
        this.updateView();
    }

    /**
     * Shows or hides certain content in the view.
     */
    private updateView(): void {
        const hasPerms = this.checkPermissions();
        const permsChanged = hasPerms !== this.lastPermissionCheckResult;

        if (hasPerms && permsChanged) {
            // clean up and add the template
            this.viewContainer.clear();
            this.viewContainer.createEmbeddedView(this.template);
        } else if (!hasPerms) {
            // will remove the content of the container
            this.viewContainer.clear();
        }
        this.lastPermissionCheckResult = hasPerms;
    }

    /**
     * Compare the required permissions with the users permissions.
     * Returns true if the users permissions fit.
     */
    private checkPermissions(): boolean {
        return this.permissions.length === 0 || this.operator.hasPerms(...this.permissions);
    }
}
