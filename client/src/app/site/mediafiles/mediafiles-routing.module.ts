import { NgModule, Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MediafileListComponent } from './mediafile-list/mediafile-list.component';

const routes: Routes = [{ path: '', component: MediafileListComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MediafilesRoutingModule {}
