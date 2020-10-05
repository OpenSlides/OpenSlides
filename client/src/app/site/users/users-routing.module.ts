import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { Permission } from 'app/core/core-services/operator.service';
import { GroupListComponent } from './components/group-list/group-list.component';
import { PasswordComponent } from './components/password/password.component';
import { PresenceDetailComponent } from './components/presence-detail/presence-detail.component';
import { UserDetailComponent } from './components/user-detail/user-detail.component';
import { UserImportListComponent } from './components/user-import/user-import-list.component';
import { UserListComponent } from './components/user-list/user-list.component';

const routes: Route[] = [
    {
        path: '',
        component: UserListComponent,
        pathMatch: 'full',
        data: { basePerm: Permission.usersCanSeeName }
    },
    {
        path: 'password',
        component: PasswordComponent,
        data: { basePerm: Permission.usersCanChangePassword }
    },
    {
        path: 'password/:id',
        component: PasswordComponent,
        data: { basePerm: Permission.usersCanManage }
    },
    {
        path: 'new',
        component: UserDetailComponent,
        data: { basePerm: Permission.usersCanManage }
    },
    {
        path: 'import',
        component: UserImportListComponent,
        data: { basePerm: Permission.usersCanManage }
    },
    {
        path: 'presence',
        component: PresenceDetailComponent,
        // TODO: 'users_enable_presence_view' missing in permissions
        data: { basePerm: Permission.usersCanManage }
    },
    {
        path: 'groups',
        component: GroupListComponent,
        data: { basePerm: Permission.usersCanManage }
    },
    {
        path: ':id',
        component: UserDetailComponent
        // No basePerm, because user is allowed to see the own profile page.
        // Other user detail pages are empty if user does not have user.can_see_name.
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UsersRoutingModule {}
