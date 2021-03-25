import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// MaterialUI modules
import { MatBadgeModule } from '@angular/material/badge';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule, MatAnchor } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatRadioModule } from '@angular/material/radio';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkTreeModule } from '@angular/cdk/tree';
import { ScrollingModule } from '@angular/cdk/scrolling';

// ngx-translate
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// ngx-file-drop
import { NgxFileDropModule } from 'ngx-file-drop';

// TinyMCE
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';

// directives
import { PermsDirective } from './directives/perms.directive';
import { IsSuperAdminDirective } from './directives/is-super-admin.directive';
import { DomChangeDirective } from './directives/dom-change.directive';
import { AutofocusDirective } from './directives/autofocus.directive';

// PblNgrid. Cleanup Required.
import { PblNgridModule } from '@pebula/ngrid';
import { PblNgridMaterialModule } from '@pebula/ngrid-material';
import { PblNgridTargetEventsModule } from '@pebula/ngrid/target-events';

// time picker because angular still doesnt offer one!!
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { ChartsModule } from 'ng2-charts';

// components
import { HeadBarComponent } from './components/head-bar/head-bar.component';
import { LegalNoticeContentComponent } from './components/legal-notice-content/legal-notice-content.component';
import { PrivacyPolicyContentComponent } from './components/privacy-policy-content/privacy-policy-content.component';
import { SearchValueSelectorComponent } from './components/search-value-selector/search-value-selector.component';
import { OpenSlidesDateAdapter } from './date-adapter';
import { PromptDialogComponent } from './components/prompt-dialog/prompt-dialog.component';
import { SortingListComponent } from './components/sorting-list/sorting-list.component';
import { SortingTreeComponent } from './components/sorting-tree/sorting-tree.component';
import { ChoiceDialogComponent } from './components/choice-dialog/choice-dialog.component';
import { SortFilterBarComponent } from './components/sort-filter-bar/sort-filter-bar.component';
import { SortBottomSheetComponent } from './components/sort-filter-bar/sort-bottom-sheet/sort-bottom-sheet.component';
import { FilterMenuComponent } from './components/sort-filter-bar/filter-menu/filter-menu.component';
import { LogoComponent } from './components/logo/logo.component';
import { C4DialogComponent, CopyrightSignComponent } from './components/copyright-sign/copyright-sign.component';
import { ProjectorButtonComponent } from './components/projector-button/projector-button.component';
import { ProjectionDialogComponent } from './components/projection-dialog/projection-dialog.component';
import { ResizedDirective } from './directives/resized.directive';
import { MetaTextBlockComponent } from './components/meta-text-block/meta-text-block.component';
import { OpenSlidesTranslateModule } from '../core/translate/openslides-translate-module';
import { ProjectorComponent } from './components/projector/projector.component';
import { SlideContainerComponent } from './components/slide-container/slide-container.component';
import { CountdownTimeComponent } from './components/contdown-time/countdown-time.component';
import { MediaUploadContentComponent } from './components/media-upload-content/media-upload-content.component';
import { PrecisionPipe } from './pipes/precision.pipe';
import { SpeakerButtonComponent } from './components/speaker-button/speaker-button.component';
import { GridLayoutComponent } from './components/grid-layout/grid-layout.component';
import { TileComponent } from './components/tile/tile.component';
import { BlockTileComponent } from './components/block-tile/block-tile.component';
import { IconContainerComponent } from './components/icon-container/icon-container.component';
import { ListViewTableComponent } from './components/list-view-table/list-view-table.component';
import { AgendaContentObjectFormComponent } from './components/agenda-content-object-form/agenda-content-object-form.component';
import { ExtensionFieldComponent } from './components/extension-field/extension-field.component';
import { AttachmentControlComponent } from './components/attachment-control/attachment-control.component';
import { RoundedInputComponent } from './components/rounded-input/rounded-input.component';
import { ProgressSnackBarComponent } from './components/progress-snack-bar/progress-snack-bar.component';
import { SuperSearchComponent } from 'app/site/common/components/super-search/super-search.component';
import { OverlayComponent } from 'app/site/common/components/overlay/overlay.component';
import { PreviewComponent } from './components/preview/preview.component';
import { PdfViewerModule } from 'ng2-pdf-viewer';

import { HeightResizingDirective } from './directives/height-resizing.directive';
import { TrustPipe } from './pipes/trust.pipe';
import { LocalizedDatePipe } from './pipes/localized-date.pipe';
import { ChartsComponent } from './components/charts/charts.component';
import { CheckInputComponent } from './components/check-input/check-input.component';
import { BannerComponent } from './components/banner/banner.component';
import { PollFormComponent } from 'app/site/polls/components/poll-form/poll-form.component';
import { EntitledUsersTableComponent } from 'app/site/polls/components/entitled-users-table/entitled-users-table.component';
import { MotionPollDialogComponent } from 'app/site/motions/modules/motion-poll/motion-poll-dialog/motion-poll-dialog.component';
import { ParsePollNumberPipe } from './pipes/parse-poll-number.pipe';
import { ReversePipe } from './pipes/reverse.pipe';
import { PollKeyVerbosePipe } from './pipes/poll-key-verbose.pipe';
import { PollPercentBasePipe } from './pipes/poll-percent-base.pipe';
import { VotingPrivacyWarningComponent } from './components/voting-privacy-warning/voting-privacy-warning.component';
import { MotionPollDetailContentComponent } from './components/motion-poll-detail-content/motion-poll-detail-content.component';
import { AssignmentPollDetailContentComponent } from './components/assignment-poll-detail-content/assignment-poll-detail-content.component';

import { GlobalSpinnerComponent } from './components/global-spinner/global-spinner.component';
import { UserMenuComponent } from './components/user-menu/user-menu.component';
import { JitsiComponent } from './components/jitsi/jitsi.component';
import { VideoPlayerComponent } from './components/video-player/video-player.component';
import { ListOfSpeakersContentComponent } from './components/list-of-speakers-content/list-of-speakers-content.component';
import { ApplauseBarDisplayComponent } from './components/applause-bar-display/applause-bar-display.component';
import { ProgressComponent } from './components/progress/progress.component';
import { NgParticlesModule } from 'ng-particles';
import { ApplauseParticleDisplayComponent } from './components/applause-particle-display/applause-particle-display.component';

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
        MatMomentDateModule,
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
        MatSlideToggleModule,
        MatDividerModule,
        DragDropModule,
        OpenSlidesTranslateModule.forChild(),
        RouterModule,
        NgxMatSelectSearchModule,
        NgxFileDropModule,
        EditorModule,
        CdkTreeModule,
        ScrollingModule,
        PblNgridModule,
        PblNgridMaterialModule,
        PblNgridTargetEventsModule,
        PdfViewerModule,
        NgxMaterialTimepickerModule,
        ChartsModule,
        NgParticlesModule
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
        MatSlideToggleModule,
        MatDividerModule,
        DragDropModule,
        NgxMatSelectSearchModule,
        NgxFileDropModule,
        TranslateModule,
        OpenSlidesTranslateModule,
        PdfViewerModule,
        PermsDirective,
        IsSuperAdminDirective,
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
        SortFilterBarComponent,
        LogoComponent,
        CopyrightSignComponent,
        C4DialogComponent,
        ProjectorButtonComponent,
        ProjectionDialogComponent,
        ResizedDirective,
        HeightResizingDirective,
        MetaTextBlockComponent,
        ProjectorComponent,
        SlideContainerComponent,
        CountdownTimeComponent,
        MediaUploadContentComponent,
        AttachmentControlComponent,
        PrecisionPipe,
        SpeakerButtonComponent,
        GridLayoutComponent,
        TileComponent,
        BlockTileComponent,
        ScrollingModule,
        IconContainerComponent,
        SpeakerButtonComponent,
        PblNgridModule,
        PblNgridMaterialModule,
        PblNgridTargetEventsModule,
        ListViewTableComponent,
        AgendaContentObjectFormComponent,
        ExtensionFieldComponent,
        RoundedInputComponent,
        GlobalSpinnerComponent,
        UserMenuComponent,
        OverlayComponent,
        PreviewComponent,
        NgxMaterialTimepickerModule,
        ChartsModule,
        TrustPipe,
        LocalizedDatePipe,
        ChartsComponent,
        CheckInputComponent,
        BannerComponent,
        PollFormComponent,
        EntitledUsersTableComponent,
        MotionPollDialogComponent,
        ParsePollNumberPipe,
        ReversePipe,
        PollKeyVerbosePipe,
        PollPercentBasePipe,
        VotingPrivacyWarningComponent,
        MotionPollDetailContentComponent,
        AssignmentPollDetailContentComponent,
        JitsiComponent,
        VideoPlayerComponent,
        ListOfSpeakersContentComponent
    ],
    declarations: [
        PermsDirective,
        IsSuperAdminDirective,
        DomChangeDirective,
        AutofocusDirective,
        HeadBarComponent,
        LegalNoticeContentComponent,
        PrivacyPolicyContentComponent,
        SearchValueSelectorComponent,
        PromptDialogComponent,
        SortingListComponent,
        SortingTreeComponent,
        ChoiceDialogComponent,
        SortFilterBarComponent,
        SortBottomSheetComponent,
        FilterMenuComponent,
        LogoComponent,
        CopyrightSignComponent,
        C4DialogComponent,
        ProjectorButtonComponent,
        ProjectionDialogComponent,
        ResizedDirective,
        MetaTextBlockComponent,
        ProjectorComponent,
        SlideContainerComponent,
        CountdownTimeComponent,
        MediaUploadContentComponent,
        PrecisionPipe,
        SpeakerButtonComponent,
        GridLayoutComponent,
        TileComponent,
        BlockTileComponent,
        IconContainerComponent,
        ListViewTableComponent,
        AgendaContentObjectFormComponent,
        ExtensionFieldComponent,
        AttachmentControlComponent,
        RoundedInputComponent,
        ProgressSnackBarComponent,
        GlobalSpinnerComponent,
        UserMenuComponent,
        SuperSearchComponent,
        OverlayComponent,
        PreviewComponent,
        HeightResizingDirective,
        TrustPipe,
        LocalizedDatePipe,
        ChartsComponent,
        CheckInputComponent,
        BannerComponent,
        PollFormComponent,
        EntitledUsersTableComponent,
        MotionPollDialogComponent,
        ParsePollNumberPipe,
        ReversePipe,
        PollKeyVerbosePipe,
        PollPercentBasePipe,
        VotingPrivacyWarningComponent,
        MotionPollDetailContentComponent,
        AssignmentPollDetailContentComponent,
        JitsiComponent,
        VideoPlayerComponent,
        ListOfSpeakersContentComponent,
        ApplauseBarDisplayComponent,
        ProgressComponent,
        ApplauseParticleDisplayComponent
    ],
    providers: [
        {
            provide: DateAdapter,
            useClass: OpenSlidesDateAdapter,
            deps: [TranslateService, MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
        }, // see remarks in OpenSlidesDateAdapter
        {
            provide: TINYMCE_SCRIPT_SRC,
            useValue: 'tinymce/tinymce.min.js'
        },
        SearchValueSelectorComponent,
        SortingListComponent,
        SortingTreeComponent,
        SortFilterBarComponent,
        SortBottomSheetComponent,
        DecimalPipe,
        ProgressSnackBarComponent,
        TrustPipe,
        LocalizedDatePipe,
        ParsePollNumberPipe,
        ReversePipe,
        PollKeyVerbosePipe,
        PollPercentBasePipe
    ]
})
export class SharedModule {}
