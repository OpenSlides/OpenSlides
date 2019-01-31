import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GroupListComponent } from './components/group-list/group-list.component';
import { PasswordComponent } from './components/password/password.component';
import { PresenceDetailComponent } from './components/presence-detail/presence-detail.component';
import { UserDetailComponent } from './components/user-detail/user-detail.component';
import { UserImportListComponent } from './components/user-import/user-import-list.component';
import { UserListComponent } from './components/user-list/user-list.component';

const routes: Routes = [
    {
        path: '',
        component: UserListComponent
    },
    {
        path: 'password',
        component: PasswordComponent
    },
    {
        path: 'password/:id',
        component: PasswordComponent
    },
    {
        path: 'new',
        component: UserDetailComponent
    },
    {
        path: 'import',
        component: UserImportListComponent
    },
    {
        path: 'presence',
        component: PresenceDetailComponent
        // FIXME: CRITICAL: restricted to basePerm: 'users.can_manage' and config 'users_enable_presence_view'
    },
    {
        path: 'groups',
        component: GroupListComponent
        /**
         * FIXME: CRITICAL:
         * Refreshing the page, even while having the required permission, will navigate you back to "/"
         * Makes developing protected areas impossible.
         * Has the be (temporarily) removed if this page should be edited.
         */
        // data: { basePerm: 'users.can_manage' }
    },
    {
        path: ':id',
        component: UserDetailComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UsersRoutingModule {}
