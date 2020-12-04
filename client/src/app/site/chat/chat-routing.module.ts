import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { ChatGroupDetailComponent } from './components/chat-group-detail/chat-group-detail.component';
import { ChatGroupListComponent } from './components/chat-group-list/chat-group-list.component';

const routes: Route[] = [
    {
        path: '',
        pathMatch: 'full',
        component: ChatGroupListComponent
    },
    { path: ':id', component: ChatGroupDetailComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ChatRoutingModule {}
