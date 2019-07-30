import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { GroupListComponent } from './components/group-list/group-list.component';
import { PasswordComponent } from './components/password/password.component';
import { PresenceDetailComponent } from './components/presence-detail/presence-detail.component';
import { SharedModule } from '../../shared/shared.module';
import { UserDetailComponent } from './components/user-detail/user-detail.component';
import { UserImportListComponent } from './components/user-import/user-import-list.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { UsersRoutingModule } from './users-routing.module';

@NgModule({
    imports: [CommonModule, UsersRoutingModule, SharedModule],
    declarations: [
        UserListComponent,
        UserDetailComponent,
        GroupListComponent,
        PasswordComponent,
        UserImportListComponent,
        PresenceDetailComponent
    ]
})
export class UsersModule {}
