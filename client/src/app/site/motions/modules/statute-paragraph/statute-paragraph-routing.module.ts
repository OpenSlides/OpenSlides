import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StatuteParagraphListComponent } from './components/statute-paragraph-list/statute-paragraph-list.component';
import { StatuteImportListComponent } from './components/statute-import-list/statute-import-list.component';

const routes: Routes = [
    { path: '', component: StatuteParagraphListComponent, pathMatch: 'full' },
    { path: 'import', component: StatuteImportListComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class StatuteParagraphRoutingModule {}
