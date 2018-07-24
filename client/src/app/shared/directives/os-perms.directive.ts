import { Directive, Input, ElementRef, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';

import { OperatorService } from 'app/core/services/operator.service';
import { OpenSlidesComponent } from 'app/openslides.component';
import { Group } from 'app/shared/models/users/group';

/**
 * Directive to check if the {@link OperatorService} has the correct permissions to access certain functions
 *
 * Successor of os-perms in OpenSlides 2.2
 * @example <div *appOsPerms=".." ..> ... < /div>
 */
@Directive({
    selector: '[appOsPerms]'
})
export class OsPermsDirective extends OpenSlidesComponent {
    /**
     * Holds the {@link OperatorService} permissions
     */
    private userPermissions: string[];

    /**
     * Holds the required permissions the access a feature
     */
    private permissions;

    /**
     * Constructs the direcctive once. Observes the operator for it's groups so the directvice can perform changes
     * dynamically
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
        this.userPermissions = [];

        // observe groups of operator, so the directive can actively react to changes
        this.operator.getObservable().subscribe(content => {
            console.log('os-perms did monitor changes in observer: ', content);
            if (content instanceof Group && this.permissions !== '') {
                console.log('content was a Group');
                this.userPermissions = [...this.userPermissions, ...content.permissions];
                this.updateView();
            }
        });
    }

    /**
     * Comes directly from the view.
     * The value defines the requires permissions.
     */
    @Input()
    set appOsPerms(value) {
        this.permissions = value;
        this.readUserPermissions();
        this.updateView();
    }

    /**
     * Updates the local `userPermissions[]` by the permissions found in the operators groups
     * Will just set, but not remove them.
     */
    private readUserPermissions(): void {
        const opGroups = this.operator.getGroups();
        console.log('operator Groups: ', opGroups);
        opGroups.forEach(group => {
            this.userPermissions = [...this.userPermissions, ...group.permissions];
        });
    }

    /**
     * Shows or hides certain content in the view.
     */
    private updateView(): void {
        if (this.checkPermissions()) {
            // will just render the page normally
            this.viewContainer.createEmbeddedView(this.template);
        } else {
            // will remove the content of the container
            this.viewContainer.clear();
        }
    }

    /**
     * Compare the required permissions with the users permissions.
     * Returns true if the users permissions fit.
     */
    private checkPermissions(): boolean {
        let isPermitted = false;
        if (this.userPermissions && this.permissions) {
            this.permissions.forEach(perm => {
                isPermitted = this.userPermissions.find(userPerm => userPerm === perm) ? true : false;
            });
        }
        return isPermitted;
    }
}
