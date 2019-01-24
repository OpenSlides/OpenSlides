import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// MaterialUI modules
import {
    MatButtonModule,
    MatCheckboxModule,
    MatToolbarModule,
    MatCardModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    DateAdapter,
    MatIconModule,
    MatButtonToggleModule,
    MatBadgeModule,
    MatStepperModule,
    MatTabsModule,
    MatBottomSheetModule,
    MatSliderModule
} from '@angular/material';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material';
import { MatRadioModule } from '@angular/material';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DragDropModule } from '@angular/cdk/drag-drop';

// ngx-translate
import { TranslateModule } from '@ngx-translate/core';

// ngx-file-drop
import { FileDropModule } from 'ngx-file-drop';

// TinyMCE
import { EditorModule } from '@tinymce/tinymce-angular';

// directives
import { PermsDirective } from './directives/perms.directive';
import { DomChangeDirective } from './directives/dom-change.directive';
import { AutofocusDirective } from './directives/autofocus.directive';

// tree sorting
import { TreeModule } from 'angular-tree-component';

// components
import { HeadBarComponent } from './components/head-bar/head-bar.component';
import { LegalNoticeContentComponent } from './components/legal-notice-content/legal-notice-content.component';
import { PrivacyPolicyContentComponent } from './components/privacy-policy-content/privacy-policy-content.component';
import { SearchValueSelectorComponent } from './components/search-value-selector/search-value-selector.component';
import { OpenSlidesDateAdapter } from './date-adapter';
import { PromptDialogComponent } from './components/prompt-dialog/prompt-dialog.component';
import { SortingListComponent } from './components/sorting-list/sorting-list.component';
import { SpeakerListComponent } from 'app/site/agenda/components/speaker-list/speaker-list.component';
import { SortingTreeComponent } from './components/sorting-tree/sorting-tree.component';
import { ChoiceDialogComponent } from './components/choice-dialog/choice-dialog.component';
import { OsSortFilterBarComponent } from './components/os-sort-filter-bar/os-sort-filter-bar.component';
import { OsSortBottomSheetComponent } from './components/os-sort-filter-bar/os-sort-bottom-sheet/os-sort-bottom-sheet.component';
import { FilterMenuComponent } from './components/os-sort-filter-bar/filter-menu/filter-menu.component';
import { LogoComponent } from './components/logo/logo.component';
import { C4DialogComponent, CopyrightSignComponent } from './components/copyright-sign/copyright-sign.component';
import { ProjectorButtonComponent } from './components/projector-button/projector-button.component';
import { ProjectionDialogComponent } from './components/projection-dialog/projection-dialog.component';
import { ResizedDirective } from './directives/resized.directive';
import { MetaTextBlockComponent } from './components/meta-text-block/meta-text-block.component';

/**
 * Share Module for all "dumb" components and pipes.
 *
 * These components don not import and inject services from core or other features
 * in their constructors.
 *
 * Should receive all data though attributes in the template of the component using them.
 * No dependency to the rest of our application.
 */
@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        MatFormFieldModule,
        MatSelectModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatCheckboxModule,
        MatToolbarModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatCardModule,
        MatInputModule,
        MatTableModule,
        MatSortModule,
        MatPaginatorModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatSidenavModule,
        MatListModule,
        MatExpansionModule,
        MatMenuModule,
        MatDialogModule,
        MatSnackBarModule,
        MatChipsModule,
        MatBottomSheetModule,
        MatTooltipModule,
        MatBadgeModule,
        // TODO: there is an error with missing icons
        // we either wait or include a fixed version manually (dirty)
        // https://github.com/google/material-design-icons/issues/786
        MatIconModule,
        MatRadioModule,
        MatButtonToggleModule,
        MatStepperModule,
        MatTabsModule,
        MatSliderModule,
        DragDropModule,
        TranslateModule.forChild(),
        RouterModule,
        NgxMatSelectSearchModule,
        FileDropModule,
        EditorModule,
        TreeModule.forRoot()
    ],
    exports: [
        FormsModule,
        MatAutocompleteModule,
        MatFormFieldModule,
        MatSelectModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatToolbarModule,
        MatCardModule,
        MatDatepickerModule,
        MatInputModule,
        MatTableModule,
        MatSortModule,
        MatPaginatorModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatSidenavModule,
        MatListModule,
        MatExpansionModule,
        MatMenuModule,
        MatDialogModule,
        MatSnackBarModule,
        MatChipsModule,
        MatTooltipModule,
        MatTabsModule,
        MatBadgeModule,
        MatIconModule,
        MatRadioModule,
        MatButtonToggleModule,
        MatStepperModule,
        MatSliderModule,
        DragDropModule,
        NgxMatSelectSearchModule,
        FileDropModule,
        TranslateModule,
        PermsDirective,
        DomChangeDirective,
        AutofocusDirective,
        HeadBarComponent,
        SearchValueSelectorComponent,
        LegalNoticeContentComponent,
        PrivacyPolicyContentComponent,
        PromptDialogComponent,
        SortingListComponent,
        EditorModule,
        SortingTreeComponent,
        TreeModule,
        OsSortFilterBarComponent,
        LogoComponent,
        CopyrightSignComponent,
        C4DialogComponent,
        ProjectorButtonComponent,
        ProjectionDialogComponent,
        ResizedDirective,
        MetaTextBlockComponent
    ],
    declarations: [
        PermsDirective,
        DomChangeDirective,
        AutofocusDirective,
        HeadBarComponent,
        LegalNoticeContentComponent,
        PrivacyPolicyContentComponent,
        SearchValueSelectorComponent,
        PromptDialogComponent,
        SortingListComponent,
        SpeakerListComponent,
        SortingTreeComponent,
        ChoiceDialogComponent,
        OsSortFilterBarComponent,
        OsSortBottomSheetComponent,
        FilterMenuComponent,
        LogoComponent,
        CopyrightSignComponent,
        C4DialogComponent,
        ProjectorButtonComponent,
        ProjectionDialogComponent,
        ResizedDirective,
        MetaTextBlockComponent
    ],
    providers: [
        { provide: DateAdapter, useClass: OpenSlidesDateAdapter },
        SearchValueSelectorComponent,
        SortingListComponent,
        SortingTreeComponent,
        OsSortFilterBarComponent,
        OsSortBottomSheetComponent
    ],
    entryComponents: [OsSortBottomSheetComponent, C4DialogComponent]
})
export class SharedModule {}
