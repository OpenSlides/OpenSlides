import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UserListComponent } from './components/user-list/user-list.component';
import { UserDetailComponent } from './components/user-detail/user-detail.component';

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
        path: ':id',
        component: UserDetailComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UsersRoutingModule {}
