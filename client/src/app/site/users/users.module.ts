import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsersRoutingModule } from './users-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { UserListComponent } from './components/user-list/user-list.component';
import { UserDetailComponent } from './components/user-detail/user-detail.component';
import { GroupListComponent } from './components/group-list/group-list.component';

@NgModule({
    imports: [CommonModule, UsersRoutingModule, SharedModule],
    declarations: [UserListComponent, UserDetailComponent, GroupListComponent]
})
export class UsersModule {}
