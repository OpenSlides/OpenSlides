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
    MatBadgeModule
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

// directives
import { PermsDirective } from './directives/perms.directive';
import { DomChangeDirective } from './directives/dom-change.directive';
import { AutofocusDirective } from './directives/autofocus.directive';

// components
import { HeadBarComponent } from './components/head-bar/head-bar.component';
import { FooterComponent } from './components/footer/footer.component';
import { LegalNoticeContentComponent } from './components/legal-notice-content/legal-notice-content.component';
import { PrivacyPolicyContentComponent } from './components/privacy-policy-content/privacy-policy-content.component';
import { SearchValueSelectorComponent } from './components/search-value-selector/search-value-selector.component';
import { OpenSlidesDateAdapter } from './date-adapter';
import { PromptDialogComponent } from './components/prompt-dialog/prompt-dialog.component';
import { SortingListComponent } from './components/sorting-list/sorting-list.component';
import { SpeakerListComponent } from 'app/site/agenda/components/speaker-list/speaker-list.component';

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
        MatProgressSpinnerModule,
        MatSidenavModule,
        MatListModule,
        MatExpansionModule,
        MatMenuModule,
        MatDialogModule,
        MatSnackBarModule,
        MatChipsModule,
        MatTooltipModule,
        MatBadgeModule,
        // TODO: there is an error with missing icons
        // we either wait or include a fixed version manually (dirty)
        // https://github.com/google/material-design-icons/issues/786
        MatIconModule,
        MatRadioModule,
        MatButtonToggleModule,
        DragDropModule,
        TranslateModule.forChild(),
        RouterModule,
        NgxMatSelectSearchModule
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
        MatProgressSpinnerModule,
        MatSidenavModule,
        MatListModule,
        MatExpansionModule,
        MatMenuModule,
        MatDialogModule,
        MatSnackBarModule,
        MatChipsModule,
        MatTooltipModule,
        MatBadgeModule,
        MatIconModule,
        MatRadioModule,
        MatButtonToggleModule,
        DragDropModule,
        NgxMatSelectSearchModule,
        TranslateModule,
        PermsDirective,
        DomChangeDirective,
        AutofocusDirective,
        FooterComponent,
        HeadBarComponent,
        SearchValueSelectorComponent,
        LegalNoticeContentComponent,
        PrivacyPolicyContentComponent,
        PromptDialogComponent,
        SortingListComponent
    ],
    declarations: [
        PermsDirective,
        DomChangeDirective,
        AutofocusDirective,
        HeadBarComponent,
        FooterComponent,
        LegalNoticeContentComponent,
        PrivacyPolicyContentComponent,
        SearchValueSelectorComponent,
        PromptDialogComponent,
        SortingListComponent,
        SpeakerListComponent
    ],
    providers: [
        { provide: DateAdapter, useClass: OpenSlidesDateAdapter },
        SearchValueSelectorComponent,
        SortingListComponent
    ]
})
export class SharedModule {}
