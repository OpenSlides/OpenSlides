import { Directive, Input, ElementRef, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { OperatorService } from 'app/core/services/operator.service';
import { BaseComponent } from 'app/base.component';
import { Group } from 'app/core/models/users/group';

@Directive({
    selector: '[appOsPerms]'
})
export class OsPermsDirective extends BaseComponent {
    private userPermissions: string[];
    private permissions;

    constructor(
        private element: ElementRef,
        private template: TemplateRef<any>,
        private viewContainer: ViewContainerRef, //TODO private operator. OperatorService
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

    @Input()
    set appOsPerms(value) {
        this.permissions = value;
        this.readUserPermissions();
        this.updateView();
    }

    private readUserPermissions(): void {
        const opGroups = this.operator.getGroups();
        console.log('operator Groups: ', opGroups);
        opGroups.forEach(group => {
            this.userPermissions = [...this.userPermissions, ...group.permissions];
        });
    }

    // hides or shows a contrainer
    private updateView(): void {
        if (this.checkPermissions()) {
            // will just render the page normally
            this.viewContainer.createEmbeddedView(this.template);
        } else {
            // will remove the content of the container
            this.viewContainer.clear();
        }
    }

    // checks for the required permission
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
