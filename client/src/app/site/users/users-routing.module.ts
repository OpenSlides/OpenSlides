import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UserListComponent } from './components/user-list/user-list.component';
import { UserDetailComponent } from './components/user-detail/user-detail.component';
import { GroupListComponent } from './components/group-list/group-list.component';

const routes: Routes = [
    {
        path: '',
        component: UserListComponent
    },
    {
        path: 'new',
        component: UserDetailComponent
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
