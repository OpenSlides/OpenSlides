import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsersRoutingModule } from './users-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { UserListComponent } from './user-list/user-list.component';

@NgModule({
    imports: [CommonModule, UsersRoutingModule, SharedModule],
    declarations: [UserListComponent]
})
export class UsersModule {}
