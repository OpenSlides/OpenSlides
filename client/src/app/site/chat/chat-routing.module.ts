import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { ChatGroupListComponent } from './components/chat-group-list/chat-group-list.component';

const routes: Route[] = [
    {
        path: '',
        pathMatch: 'full',
        component: ChatGroupListComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ChatRoutingModule {}
