import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { StatuteImportListComponent } from './components/statute-import-list/statute-import-list.component';
import { StatuteParagraphListComponent } from './components/statute-paragraph-list/statute-paragraph-list.component';

const routes: Route[] = [
    { path: '', component: StatuteParagraphListComponent, pathMatch: 'full' },
    { path: 'import', component: StatuteImportListComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class StatuteParagraphRoutingModule {}
