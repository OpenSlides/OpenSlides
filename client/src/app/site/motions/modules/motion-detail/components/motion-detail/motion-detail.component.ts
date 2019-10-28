import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    OnDestroy,
    OnInit,
    ViewEncapsulation
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Subscription } from 'rxjs';

import { NotifyService } from 'app/core/core-services/notify.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { ItemRepositoryService } from 'app/core/repositories/agenda/item-repository.service';
import { CategoryRepositoryService } from 'app/core/repositories/motions/category-repository.service';
import { ChangeRecommendationRepositoryService } from 'app/core/repositories/motions/change-recommendation-repository.service';
import { MotionBlockRepositoryService } from 'app/core/repositories/motions/motion-block-repository.service';
import { MotionRepositoryService, ParagraphToChoose } from 'app/core/repositories/motions/motion-repository.service';
import { StatuteParagraphRepositoryService } from 'app/core/repositories/motions/statute-paragraph-repository.service';
import { WorkflowRepositoryService } from 'app/core/repositories/motions/workflow-repository.service';
import { TagRepositoryService } from 'app/core/repositories/tags/tag-repository.service';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { DiffLinesInParagraph, LineRange } from 'app/core/ui-services/diff.service';
import { LinenumberingService } from 'app/core/ui-services/linenumbering.service';
import { PersonalNoteService } from 'app/core/ui-services/personal-note.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { RoutingStateService } from 'app/core/ui-services/routing-state.service';
import { ViewportService } from 'app/core/ui-services/viewport.service';
import { Mediafile } from 'app/shared/models/mediafiles/mediafile';
import { Motion } from 'app/shared/models/motions/motion';
import { ViewUnifiedChange } from 'app/shared/models/motions/view-unified-change';
import { infoDialogSettings, mediumDialogSettings } from 'app/shared/utils/dialog-settings';
import { BaseViewComponent } from 'app/site/base/base-view';
import { CreateMotion } from 'app/site/motions/models/create-motion';
import { ViewCategory } from 'app/site/motions/models/view-category';
import { ViewCreateMotion } from 'app/site/motions/models/view-create-motion';
import { ViewMotion } from 'app/site/motions/models/view-motion';
import { ViewMotionBlock } from 'app/site/motions/models/view-motion-block';
import { ViewMotionChangeRecommendation } from 'app/site/motions/models/view-motion-change-recommendation';
import { ViewStatuteParagraph } from 'app/site/motions/models/view-statute-paragraph';
import { ViewWorkflow } from 'app/site/motions/models/view-workflow';
import { MotionEditNotification } from 'app/site/motions/motion-edit-notification';
import {
    ChangeRecoMode,
    LineNumberingMode,
    MotionEditNotificationType,
    PERSONAL_NOTE_ID,
    verboseChangeRecoMode
} from 'app/site/motions/motions.constants';
import { LocalPermissionsService } from 'app/site/motions/services/local-permissions.service';
import { MotionFilterListService } from 'app/site/motions/services/motion-filter-list.service';
import { MotionPdfExportService } from 'app/site/motions/services/motion-pdf-export.service';
import { MotionSortListService } from 'app/site/motions/services/motion-sort-list.service';
import { ViewTag } from 'app/site/tags/models/view-tag';
import { ViewUser } from 'app/site/users/models/view-user';
import {
    MotionChangeRecommendationDialogComponent,
    MotionChangeRecommendationDialogComponentData
} from '../motion-change-recommendation-dialog/motion-change-recommendation-dialog.component';
import {
    MotionTitleChangeRecommendationDialogComponent,
    MotionTitleChangeRecommendationDialogComponentData
} from '../motion-title-change-recommendation-dialog/motion-title-change-recommendation-dialog.component';

/**
 * Component for the motion detail view
 */
@Component({
    selector: 'os-motion-detail',
    templateUrl: './motion-detail.component.html',
    styleUrls: ['./motion-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class MotionDetailComponent extends BaseViewComponent implements OnInit, OnDestroy {
    /**
     * Motion content. Can be a new version
     */
    public contentForm: FormGroup;

    /**
     * Determine if the motion is edited
     */
    public editMotion = false;

    /**
     * Determine if the motion is a new (unsent) amendment to another motion
     */
    public amendmentEdit = false;

    /**
     * Determine if the motion is new
     */
    public newMotion = false;

    /**
     * Toggle to expand/hide the motion log.
     */
    public motionLogExpanded = false;

    /**
     * Sets the motions, e.g. via an autoupdate. Reload important things here:
     * - Reload the recommendation. Not changed with autoupdates, but if the motion is loaded this needs to run.
     */
    public set motion(value: ViewMotion) {
        this._motion = value;
        this.setupRecommender();
    }

    /**
     * Returns the target motion. Might be the new one or old.
     */
    public get motion(): ViewMotion {
        return this._motion;
    }

    /**
     * @returns the current recommendation label (with extension)
     */
    public get recommendationLabel(): string {
        return this.repo.getExtendedRecommendationLabel(this.motion);
    }

    /**
     * @returns the current state label (with extension)
     */
    public get stateLabel(): string {
        return this.repo.getExtendedStateLabel(this.motion);
    }

    private finalEditMode = false;

    /**
     * check if the 'final version edit mode' is active
     *
     * @returns true if active
     */
    public get isFinalEdit(): boolean {
        return this.finalEditMode;
    }

    /**
     * Helper to check the current state of the final version edit
     *
     * @returns true if the local edit of the modified_final_version differs
     * from the submitted version
     */
    public get finalVersionEdited(): boolean {
        return (
            this.crMode === ChangeRecoMode.ModifiedFinal &&
            this.contentForm.get('modified_final_version').value !== this.motion.modified_final_version
        );
    }

    /**
     * Saves the target motion. Accessed via the getter and setter.
     */
    private _motion: ViewMotion;

    /**
     * Value of the config variable `motions_statutes_enabled` - are statutes enabled?
     * @TODO replace by direct access to config variable, once it's available from the templates
     */
    public statutesEnabled: boolean;

    /**
     * Value of the config variable `motions_show_sequential_numbers`
     */
    public showSequential: boolean;

    /**
     * Value of the config variable `motions_reason_required`
     */
    public reasonRequired: boolean;

    /**
     * Value of the config variable `motions_hide_referring_motions`
     */
    public showReferringMotions: boolean;

    /**
     * Value of the config variable `motions_min_supporters`
     */
    public minSupporters: number;

    /**
     * Value of the config variable `motions_preamble`
     */
    public preamble: string;

    /**
     * Value of the configuration variable `motions_amendments_enabled` - are amendments enabled?
     * @TODO replace by direct access to config variable, once it's available from the templates
     */
    public amendmentsEnabled: boolean;

    /**
     * All change recommendations to this motion
     */
    public changeRecommendations: ViewMotionChangeRecommendation[];

    /**
     * All amendments to this motions
     */
    public amendments: ViewMotion[];

    /**
     * All change recommendations AND amendments, sorted by line number.
     */
    public allChangingObjects: ViewUnifiedChange[] = [];

    /**
     * preload the next motion for direct navigation
     */
    public nextMotion: ViewMotion;

    /**
     * preload the previous motion for direct navigation
     */
    public previousMotion: ViewMotion;

    /**
     * statute paragraphs, necessary for amendments
     */
    public statuteParagraphs: ViewStatuteParagraph[] = [];

    /**
     * Subject for the Categories
     */
    public categoryObserver: BehaviorSubject<ViewCategory[]>;

    /**
     * Subject for the Categories
     */
    public workflowObserver: BehaviorSubject<ViewWorkflow[]>;

    /**
     * Subject for the Submitters
     */
    public submitterObserver: BehaviorSubject<ViewUser[]>;

    /**
     * Subject for the Supporters
     */
    public supporterObserver: BehaviorSubject<ViewUser[]>;

    /**
     * Subject for the motion blocks
     */
    public blockObserver: BehaviorSubject<ViewMotionBlock[]>;

    /**
     * Subject for tags
     */
    public tagObserver: BehaviorSubject<ViewTag[]>;

    /**
     * Subject for (other) motions
     */
    public motionObserver: BehaviorSubject<ViewMotion[]>;

    /**
     * List of presorted motions. Filles by sort service
     * and filter service.
     * To navigate back and forth
     */
    private sortedMotions: ViewMotion[];

    /**
     * Determine if the name of supporters are visible
     */
    public showSupporters = false;

    /**
     * Value for os-motion-detail-diff: when this is set, that component scrolls to the given change
     */
    public scrollToChange: ViewUnifiedChange = null;

    /**
     * Custom recommender as set in the settings
     */
    public recommender: string;

    /**
     * The subscription to the recommender config variable.
     */
    private recommenderSubscription: Subscription;

    /**
     * If this is a paragraph-based amendment, this indicates if the non-affected paragraphs should be shown as well
     */
    public showAmendmentContext = false;

    /**
     * For using the enum constants from the template
     */
    public ChangeRecoMode = ChangeRecoMode;

    public verboseChangeRecoMode = verboseChangeRecoMode;

    /**
     * For using the enum constants from the template
     */
    public LineNumberingMode = LineNumberingMode;

    /**
     * Indicates the LineNumberingMode Mode.
     */
    public lnMode: LineNumberingMode;

    /**
     * Indicates the Change reco Mode.
     */
    public crMode: ChangeRecoMode;

    /**
     * Indicates the maximum line length as defined in the configuration.
     */
    public lineLength: number;

    /**
     * Indicates the currently highlighted line, if any.
     */
    public highlightedLine: number;

    /**
     * Validator for checking the go to line number input field
     */
    public highlightedLineMatcher: ErrorStateMatcher;

    /**
     * Indicates if the highlight line form was opened
     */
    public highlightedLineOpened: boolean;

    /**
     * Holds the model for the typed line number
     */
    public highlightedLineTyping: number;

    /**
     * new state extension label to be submitted, if state extensions can be set
     */
    public newStateExtension = '';

    /**
     * State extension label for the recommendation.
     */
    public recommendationStateExtension = '';

    /**
     * Constant to identify the notification-message.
     */
    public NOTIFICATION_EDIT_MOTION = 'notifyEditMotion';

    /**
     * Array to recognize, if there are other persons working on the same
     * motion and see, if those persons leave the editing-view.
     */
    private otherWorkOnMotion: string[] = [];

    /**
     * The variable to hold the subscription for notifications in editing-view.
     * Necessary to unsubscribe after leaving the editing-view.
     */
    private editNotificationSubscription: Subscription;

    /**
     * Hold the subscription to the navigation.
     * This cannot go into the subscription-list, since it should
     * only get destroyed using ngOnDestroy routine and not on route changes.
     */
    private navigationSubscription: Subscription;

    public recommendationReferencingMotions: ViewMotion[] = [];

    /**
     * Constructs the detail view.
     *
     * @param title
     * @param translate
     * @param matSnackBar
     * @param vp the viewport service
     * @param operator Operator Service
     * @param perms local permissions
     * @param router to navigate back to the motion list and to an existing motion
     * @param route determine if this is a new or an existing motion
     * @param formBuilder For reactive forms. Form Group and Form Control
     * @param dialogService For opening dialogs
     * @param el The native element
     * @param repo Motion Repository
     * @param changeRecoRepo Change Recommendation Repository
     * @param statuteRepo: Statute Paragraph Repository
     * @param mediafileRepo Mediafile Repository
     * @param DS The DataStoreService
     * @param configService The configuration provider
     * @param promptService ensure safe deletion
     * @param pdfExport export the motion to pdf
     * @param personalNoteService: personal comments and favorite marker
     * @param linenumberingService The line numbering service
     * @param categoryRepo Repository for categories
     * @param viewModelStore accessing view models
     * @param categoryRepo access the category repository
     * @param userRepo Repository for users
     * @param notifyService: NotifyService work with notification
     * @param tagRepo
     * @param mediaFilerepo
     * @param workflowRepo
     * @param blockRepo
     * @param itemRepo
     * @param motionSortService
     * @param motionFilterListService
     */
    public constructor(
        title: Title,
        protected translate: TranslateService, // protected required for ng-translate-extract
        matSnackBar: MatSnackBar,
        public vp: ViewportService,
        public operator: OperatorService,
        public perms: LocalPermissionsService,
        private router: Router,
        private route: ActivatedRoute,
        private formBuilder: FormBuilder,
        private dialogService: MatDialog,
        private el: ElementRef,
        public repo: MotionRepositoryService,
        private changeRecoRepo: ChangeRecommendationRepositoryService,
        private statuteRepo: StatuteParagraphRepositoryService,
        private configService: ConfigService,
        private promptService: PromptService,
        private pdfExport: MotionPdfExportService,
        private personalNoteService: PersonalNoteService,
        private linenumberingService: LinenumberingService,
        private categoryRepo: CategoryRepositoryService,
        private userRepo: UserRepositoryService,
        private notifyService: NotifyService,
        private tagRepo: TagRepositoryService,
        private workflowRepo: WorkflowRepositoryService,
        private blockRepo: MotionBlockRepositoryService,
        private itemRepo: ItemRepositoryService,
        private motionSortService: MotionSortListService,
        private motionFilterService: MotionFilterListService,
        private routingStateService: RoutingStateService,
        private cd: ChangeDetectorRef
    ) {
        super(title, translate, matSnackBar);
    }

    /**
     * Init.
     * Sets all required subjects and fills in the required information
     */
    public ngOnInit(): void {
        // get required information from the repositories
        this.tagObserver = this.tagRepo.getViewModelListBehaviorSubject();
        this.workflowObserver = this.workflowRepo.getViewModelListBehaviorSubject();
        this.blockObserver = this.blockRepo.getViewModelListBehaviorSubject();
        this.motionObserver = this.repo.getViewModelListBehaviorSubject();
        this.submitterObserver = this.userRepo.getViewModelListBehaviorSubject();
        this.supporterObserver = this.userRepo.getViewModelListBehaviorSubject();
        this.categoryObserver = this.categoryRepo.getViewModelListBehaviorSubject();

        this.createForm();
        this.observeRoute();
        this.getMotionByUrl();

        // load config variables
        this.configService
            .get<boolean>('motions_statutes_enabled')
            .subscribe(enabled => (this.statutesEnabled = enabled));
        this.configService
            .get<boolean>('motions_reason_required')
            .subscribe(required => (this.reasonRequired = required));
        this.configService
            .get<boolean>('motions_hide_referring_motions')
            .subscribe(show => (this.showReferringMotions = !show));
        this.configService
            .get<number>('motions_min_supporters')
            .subscribe(supporters => (this.minSupporters = supporters));
        this.configService.get<string>('motions_preamble').subscribe(preamble => (this.preamble = preamble));
        this.configService
            .get<boolean>('motions_amendments_enabled')
            .subscribe(enabled => (this.amendmentsEnabled = enabled));
        this.configService.get<number>('motions_line_length').subscribe(lineLength => {
            this.lineLength = lineLength;
            this.recalcUnifiedChanges();
        });
        this.configService
            .get<LineNumberingMode>('motions_default_line_numbering')
            .subscribe(mode => (this.lnMode = mode));
        this.configService
            .get<ChangeRecoMode>('motions_recommendation_text_mode')
            .subscribe(mode => (this.crMode = mode));
        this.configService
            .get<boolean>('motions_show_sequential_numbers')
            .subscribe(shown => (this.showSequential = shown));

        // Update statute paragraphs
        this.statuteRepo.getViewModelListObservable().subscribe(newViewStatuteParagraphs => {
            this.statuteParagraphs = newViewStatuteParagraphs;
        });

        // use the filter and the search service to get the current sorting
        this.motionFilterService.initFilters(this.motionObserver);
        this.motionSortService.initSorting(this.motionFilterService.outputObservable);

        this.subscriptions.push(
            this.motionSortService.outputObservable.subscribe(motions => {
                if (motions) {
                    this.sortedMotions = motions;
                    this.setSurroundingMotions();
                }
            })
        );
    }

    /**
     * Called during view destruction.
     * Sends a notification to user editors of the motion was edited
     */
    public ngOnDestroy(): void {
        this.unsubscribeEditNotifications(MotionEditNotificationType.TYPE_CLOSING_EDITING_MOTION);
        if (this.navigationSubscription) {
            this.navigationSubscription.unsubscribe();
        }
        super.ngOnDestroy();
        this.cd.detach();
    }

    /**
     * Observes the route for events. Calls to clean all subs if the route changes.
     * Calls the motion details from the new route
     */
    public observeRoute(): void {
        this.navigationSubscription = this.router.events.subscribe(navEvent => {
            if (navEvent instanceof NavigationEnd) {
                this.cleanSubjects();
                this.getMotionByUrl();
            }
        });
    }

    /**
     * Merges amendments and change recommendations and sorts them by the line numbers.
     * Called each time one of these arrays changes.
     *
     * TODO: 1. Having logic outside of a service is bad practice
     *       2. Manipulating class parameters without an subscription should
     *          be avoided. It's safer and simpler to return values than to manipulate the scope
     *       3. This have been used three times so far. Here, in the projector and in the PDF. Find an own
     *          service to put the logic into.
     */
    private recalcUnifiedChanges(): void {
        if (!this.lineLength) {
            // Happens if this function is called before the config variable has been loaded
            return;
        }

        this.allChangingObjects = [];
        if (this.changeRecommendations) {
            this.changeRecommendations.forEach((change: ViewMotionChangeRecommendation): void => {
                this.allChangingObjects.push(change);
            });
        }
        if (this.amendments) {
            this.amendments.forEach((amendment: ViewMotion): void => {
                this.repo
                    .getAmendmentAmendedParagraphs(amendment, this.lineLength)
                    .forEach((change: ViewUnifiedChange): void => {
                        this.allChangingObjects.push(change);
                    });
            });
        }
        this.allChangingObjects.sort((a: ViewUnifiedChange, b: ViewUnifiedChange) => {
            if (a.getLineFrom() < b.getLineFrom()) {
                return -1;
            } else if (a.getLineFrom() > b.getLineFrom()) {
                return 1;
            } else {
                return 0;
            }
        });
        this.cd.markForCheck();
    }

    /**
     * determine the motion to display using the URL
     */
    public getMotionByUrl(): void {
        const params = this.route.snapshot.params;
        if (params && params.id) {
            // existing motion
            const motionId: number = +params.id;

            // the following subscriptions need to be cleared when the route changes
            this.subscriptions.push(
                this.repo.getViewModelObservable(motionId).subscribe(motion => {
                    if (motion) {
                        if (motion.isParagraphBasedAmendment()) {
                            this.contentForm.get('text').clearValidators();
                            this.contentForm.get('text').updateValueAndValidity();
                        }
                        const title = motion.getTitle();
                        super.setTitle(title);
                        this.motion = motion;
                        this.newStateExtension = this.motion.stateExtension;
                        this.recommendationStateExtension = this.motion.recommendationExtension;
                        if (!this.editMotion) {
                            this.patchForm(this.motion);
                        }
                        this.cd.markForCheck();
                    }
                }),

                this.repo.amendmentsTo(motionId).subscribe((amendments: ViewMotion[]): void => {
                    this.amendments = amendments;
                    this.recalcUnifiedChanges();
                }),
                this.repo
                    .getRecommendationReferencingMotions(motionId)
                    .subscribe(motions => (this.recommendationReferencingMotions = motions)),
                this.changeRecoRepo
                    .getChangeRecosOfMotionObservable(motionId)
                    .subscribe((recos: ViewMotionChangeRecommendation[]) => {
                        this.changeRecommendations = recos;
                        this.recalcUnifiedChanges();
                    })
            );
        } else {
            super.setTitle('New motion');
            // new motion
            this.newMotion = true;
            this.editMotion = true;
            const defaultMotion: Partial<CreateMotion> = {};
            if (this.route.snapshot.queryParams.parent) {
                this.amendmentEdit = true;
                const parentMotion = this.repo.getViewModel(this.route.snapshot.queryParams.parent);
                const defaultTitle = `${this.translate.instant('Amendment to')} ${parentMotion.identifierOrTitle}`;
                const mode = this.configService.instant<string>('motions_amendments_text_mode');
                if (mode === 'freestyle' || mode === 'fulltext') {
                    defaultMotion.title = defaultTitle;
                    defaultMotion.parent_id = parentMotion.id;
                    defaultMotion.category_id = parentMotion.category_id;
                    defaultMotion.tags_id = parentMotion.tags_id;
                    defaultMotion.motion_block_id = parentMotion.motion_block_id;
                    this.contentForm.patchValue({
                        title: defaultTitle,
                        category_id: parentMotion.category_id,
                        motion_block_id: parentMotion.motion_block_id,
                        parent_id: parentMotion.id,
                        tags_id: parentMotion.tags_id
                    });
                }
                if (mode === 'fulltext') {
                    defaultMotion.text = parentMotion.text;
                    this.contentForm.patchValue({ text: parentMotion.text });
                }
            }
            this.motion = new ViewCreateMotion(new CreateMotion(defaultMotion));
        }
    }

    /**
     * Async load the values of the motion in the Form.
     */
    public patchForm(formMotion: ViewMotion): void {
        const contentPatch: { [key: string]: any } = {};
        Object.keys(this.contentForm.controls).forEach(ctrl => {
            contentPatch[ctrl] = formMotion[ctrl];
        });

        if (formMotion.isParagraphBasedAmendment()) {
            contentPatch.selected_paragraphs = [];
            const parentMotion = this.repo.getViewModel(formMotion.parent_id);
            // Hint: lineLength is sometimes not loaded yet when this form is initialized;
            // This doesn't hurt as long as patchForm is called when editing mode is started, i.e., later.
            if (parentMotion && this.lineLength) {
                const paragraphsToChoose = this.repo.getParagraphsToChoose(parentMotion, this.lineLength);

                paragraphsToChoose.forEach((paragraph: ParagraphToChoose, paragraphNo: number): void => {
                    if (formMotion.amendment_paragraphs[paragraphNo] !== null) {
                        this.contentForm.addControl('text_' + paragraphNo, new FormControl(''));

                        contentPatch.selected_paragraphs.push(paragraph);
                        contentPatch.text = formMotion.amendment_paragraphs[paragraphNo]; // Workaround as 'text' is required from the backend
                        contentPatch['text_' + paragraphNo] = formMotion.amendment_paragraphs[paragraphNo];
                    }
                });
            }
        }

        const statuteAmendmentFieldName = 'statute_amendment';
        contentPatch[statuteAmendmentFieldName] = formMotion.isStatuteAmendment();
        this.contentForm.patchValue(contentPatch);
    }

    /**
     * Creates the forms for the Motion and the MotionVersion
     *
     * TODO: Build a custom form validator
     */
    public createForm(): void {
        const reason: any[] = [''];
        if (this.reasonRequired) {
            reason.push(Validators.required);
        }
        this.contentForm = this.formBuilder.group({
            identifier: [''],
            title: ['', Validators.required],
            text: ['', Validators.required],
            reason: reason,
            category_id: [''],
            attachments_id: [[]],
            agenda_create: [''],
            agenda_parent_id: [],
            agenda_type: [''],
            submitters_id: [],
            supporters_id: [[]],
            workflow_id: [],
            tags_id: [],
            origin: [''],
            selected_paragraphs: [],
            statute_amendment: [''], // Internal value for the checkbox, not saved to the model
            statute_paragraph_id: [''],
            motion_block_id: [],
            parent_id: [],
            modified_final_version: ['']
        });
        this.updateWorkflowIdForCreateForm();

        const component = this;
        this.highlightedLineMatcher = new (class implements ErrorStateMatcher {
            public isErrorState(control: FormControl): boolean {
                const value: string = control && control.value ? control.value + '' : '';
                const maxLineNumber = component.repo.getLastLineNumber(component.motion, component.lineLength);
                return value.match(/[^\d]/) !== null || parseInt(value, 10) >= maxLineNumber;
            }
        })();
    }

    /**
     * clicking Shift and Enter will save automatically
     *
     * @param event has the code
     */
    public onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && event.shiftKey) {
            this.saveMotion();
        }
    }

    /**
     * Using Shift, Alt + the arrow keys will navigate between the motions
     *
     * @param event has the key code
     */
    @HostListener('document:keydown', ['$event']) public onKeyNavigation(event: KeyboardEvent): void {
        if (event.key === 'ArrowLeft' && event.altKey && event.shiftKey) {
            this.navigateToMotion(this.previousMotion);
        }
        if (event.key === 'ArrowRight' && event.altKey && event.shiftKey) {
            this.navigateToMotion(this.nextMotion);
        }
    }

    /**
     * Before updating or creating, the motions needs to be prepared for paragraph based amendments.
     * A motion of type T is created, prepared and deserialized from the given motionValues
     *
     * @param motionValues valus for the new motion
     * @param ctor The motion constructor, so different motion types can be created.
     *
     * @returns the motion to save
     */
    private prepareMotionForSave<T extends Motion>(motionValues: any, ctor: new (...args: any[]) => T): T {
        const motion = new ctor();
        if (this.motion.isParagraphBasedAmendment()) {
            motion.amendment_paragraphs = this.motion.amendment_paragraphs.map(
                (paragraph: string, paragraphNo: number): string => {
                    if (paragraph === null) {
                        return null;
                    } else {
                        return motionValues['text_' + paragraphNo];
                    }
                }
            );
            motionValues.text = '';
        }

        motion.deserialize(motionValues);
        return motion;
    }

    /**
     * Creates a motion. Calls the "patchValues" function in the MotionObject
     */
    public async createMotion(): Promise<void> {
        const newMotionValues = { ...this.contentForm.value };

        if (!newMotionValues.agenda_parent_id) {
            delete newMotionValues.agenda_parent_id;
        }

        const motion = this.prepareMotionForSave(newMotionValues, CreateMotion);

        try {
            const response = await this.repo.create(motion);
            this.router.navigate(['./motions/' + response.id]);
        } catch (e) {
            this.raiseError(this.translate.instant(e));
        }
    }

    /**
     * Save a motion. Calls the "patchValues" function in the MotionObject
     */
    private updateMotionFromForm(): void {
        const newMotionValues = { ...this.contentForm.value };
        this.updateMotion(newMotionValues, this.motion).then(() => {
            this.editMotion = false;
            this.amendmentEdit = false;
        }, this.raiseError);
    }

    private async updateMotion(newMotionValues: Partial<Motion>, motion: ViewMotion): Promise<void> {
        const updateMotion = this.prepareMotionForSave(newMotionValues, Motion);
        await this.repo.update(updateMotion, motion);
    }

    /**
     * In the ui are no distinct buttons for update or create. This is decided here.
     */
    public saveMotion(): void {
        if (this.newMotion) {
            this.createMotion();
        } else {
            this.updateMotionFromForm();
            // When saving the changes, notify other users if they edit the same motion.
            this.unsubscribeEditNotifications(MotionEditNotificationType.TYPE_SAVING_EDITING_MOTION);
        }
    }

    /**
     * get the formated motion text from the repository.
     *
     * @returns formated motion texts
     */
    public getFormattedTextPlain(): string {
        // Prevent this.allChangingObjects to be reordered from within formatMotion
        const changes: ViewUnifiedChange[] = Object.assign([], this.getAllTextChangingObjects());
        const formatedText = this.repo.formatMotion(
            this.motion.id,
            this.crMode,
            changes,
            this.lineLength,
            this.highlightedLine
        );
        return formatedText;
    }

    /**
     * If `this.motion` is an amendment, this returns the list of all changed paragraphs.
     * TODO: Cleanup: repo function could be injected part of the model, to have easier access
     *
     * @param {boolean} includeUnchanged
     * @returns {DiffLinesInParagraph[]}
     */
    public getAmendmentParagraphs(includeUnchanged: boolean): DiffLinesInParagraph[] {
        return this.repo.getAmendmentParagraphs(this.motion, this.lineLength, includeUnchanged);
    }

    /**
     * get the diff html from the statute amendment, as SafeHTML for [innerHTML]
     *
     * @returns safe html strings
     */
    public getFormattedStatuteAmendment(): string {
        return this.repo.formatStatuteAmendment(this.statuteParagraphs, this.motion, this.lineLength);
    }

    public getChangesForDiffMode(): ViewUnifiedChange[] {
        return this.allChangingObjects.filter(change => {
            return change.showInDiffView();
        });
    }

    public getChangesForFinalMode(): ViewUnifiedChange[] {
        return this.allChangingObjects.filter(change => {
            return change.showInFinalView();
        });
    }

    public getAllTextChangingObjects(): ViewUnifiedChange[] {
        return this.allChangingObjects.filter((obj: ViewUnifiedChange) => !obj.isTitleChange());
    }

    public getTitleChangingObject(): ViewUnifiedChange {
        return this.allChangingObjects.find((obj: ViewUnifiedChange) => obj.isTitleChange());
    }

    public getTitleWithChanges(): string {
        return this.changeRecoRepo.getTitleWithChanges(this.motion.title, this.getTitleChangingObject(), this.crMode);
    }

    /**
     * Trigger to delete the motion.
     */
    public async deleteMotionButton(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this motion?');
        const content = this.motion.getTitle();
        if (await this.promptService.open(title, content)) {
            await this.repo.delete(this.motion);
            this.router.navigate(['../motions/']);
        }
    }

    /**
     * Sets the motions line numbering mode
     *
     * @param mode Needs to got the enum defined in ViewMotion
     */
    public setLineNumberingMode(mode: LineNumberingMode): void {
        this.lnMode = mode;
    }

    /**
     * Returns true if no line numbers are to be shown.
     *
     * @returns whether there are line numbers at all
     */
    public isLineNumberingNone(): boolean {
        return this.lnMode === LineNumberingMode.None;
    }

    /**
     * Returns true if the line numbers are to be shown within the text with no line breaks.
     *
     * @returns whether the line numberings are inside
     */
    public isLineNumberingInline(): boolean {
        return this.lnMode === LineNumberingMode.Inside;
    }

    /**
     * Returns true if the line numbers are to be shown to the left of the text.
     *
     * @returns whether the line numberings are outside
     */
    public isLineNumberingOutside(): boolean {
        return this.lnMode === LineNumberingMode.Outside;
    }

    /**
     * Sets the motions change reco mode
     * @param mode The mode
     */
    public setChangeRecoMode(mode: ChangeRecoMode): void {
        this.crMode = mode;
    }

    /**
     * Returns true if the given version is to be shown
     *
     * @param mode The mode to check
     * @returns true, if the mode is shown
     */
    public isRecoMode(mode: ChangeRecoMode): boolean {
        return this.crMode === mode;
    }

    /**
     * Highlights the line and scrolls to it
     * @param {number} line
     */
    public gotoHighlightedLine(line: number): void {
        const maxLineNumber = this.repo.getLastLineNumber(this.motion, this.lineLength);
        if (line >= maxLineNumber) {
            return;
        }

        this.highlightedLine = line;
        // setTimeout necessary for DOM-operations to work
        window.setTimeout(() => {
            const element = <HTMLElement>this.el.nativeElement;

            // We only scroll if it's not in the screen already
            const bounding = element
                .querySelector('.os-line-number.line-number-' + line.toString(10))
                .getBoundingClientRect();
            if (bounding.top >= 0 && bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight)) {
                return;
            }

            let target: Element;
            // to make the selected line not stick at the very top of the screen, and to prevent it from being
            // conceiled from the header, we actually scroll to a element a little bit above.
            if (line > 4) {
                target = element.querySelector('.os-line-number.line-number-' + (line - 4).toString(10));
            } else {
                target = element.querySelector('.title-line');
            }
            target.scrollIntoView({ behavior: 'smooth' });
        }, 1);
    }

    /**
     * In the original version, a line number range has been selected in order to create a new change recommendation
     *
     * @param lineRange
     */
    public createChangeRecommendation(lineRange: LineRange): void {
        const data: MotionChangeRecommendationDialogComponentData = {
            editChangeRecommendation: false,
            newChangeRecommendation: true,
            lineRange: lineRange,
            changeRecommendation: this.changeRecoRepo.createChangeRecommendationTemplate(
                this.motion,
                lineRange,
                this.lineLength
            )
        };
        this.dialogService.open(MotionChangeRecommendationDialogComponent, {
            ...mediumDialogSettings,
            data: data
        });
    }

    /**
     * In the original version, the title has been clicked to create a new change recommendation
     */
    public createTitleChangeRecommendation(): void {
        const data: MotionTitleChangeRecommendationDialogComponentData = {
            editChangeRecommendation: false,
            newChangeRecommendation: true,
            changeRecommendation: this.changeRecoRepo.createTitleChangeRecommendationTemplate(
                this.motion,
                this.lineLength
            )
        };
        this.dialogService.open(MotionTitleChangeRecommendationDialogComponent, {
            ...infoDialogSettings,
            data: data
        });
    }

    public titleCanBeChanged(): boolean {
        if (this.editMotion) {
            return false;
        }
        if (this.motion.isStatuteAmendment() || this.motion.isParagraphBasedAmendment()) {
            return false;
        }
        return this.isRecoMode(ChangeRecoMode.Original) || this.isRecoMode(ChangeRecoMode.Diff);
    }

    /**
     * In the original version, a change-recommendation-annotation has been clicked
     * -> Go to the diff view and scroll to the change recommendation
     */
    public gotoChangeRecommendation(changeRecommendation: ViewMotionChangeRecommendation): void {
        this.scrollToChange = changeRecommendation;
        this.setChangeRecoMode(ChangeRecoMode.Diff);
    }

    /**
     * Goes to the amendment creation wizard. Executed via click.
     */
    public createAmendment(): void {
        const mode = this.configService.instant<string>('motions_amendments_text_mode');
        if (mode === 'paragraph') {
            this.router.navigate(['./create-amendment'], { relativeTo: this.route });
        } else {
            this.router.navigate(['./motions/new-amendment'], {
                relativeTo: this.route.snapshot.params.relativeTo,
                queryParams: { parent: this.motion.id || null }
            });
        }
    }

    /**
     * Sets the modified final version to the final version.
     */
    public async createModifiedFinalVersion(): Promise<void> {
        // Get the final version and remove line numbers
        const changes: ViewUnifiedChange[] = Object.assign([], this.getChangesForFinalMode());
        let finalVersion = this.repo.formatMotion(
            this.motion.id,
            ChangeRecoMode.Final,
            changes,
            this.lineLength,
            this.highlightedLine
        );
        finalVersion = this.linenumberingService.stripLineNumbers(finalVersion);

        // Update the motion
        try {
            // Just confirm this, if there is one modified final version the user would override.
            if (this.motion.modified_final_version) {
                const title = this.translate.instant(
                    'Are you sure you want to copy the final version to the print template?'
                );
                if (await this.promptService.open(title)) {
                    this.updateMotion({ modified_final_version: finalVersion }, this.motion).then(
                        () => this.setChangeRecoMode(ChangeRecoMode.ModifiedFinal),
                        this.raiseError
                    );
                }
            } else {
                await this.updateMotion({ modified_final_version: finalVersion }, this.motion);
            }
        } catch (e) {
            this.raiseError(e);
        }
    }

    /**
     * Deletes the modified final version
     */
    public async deleteModifiedFinalVersion(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete the print template?');
        if (await this.promptService.open(title)) {
            this.finalEditMode = false;
            this.updateMotion({ modified_final_version: '' }, this.motion).then(
                () => this.setChangeRecoMode(ChangeRecoMode.Final),
                this.raiseError
            );
        }
    }

    /**
     * Comes from the head bar
     *
     * @param mode
     */
    public setEditMode(mode: boolean): void {
        this.editMotion = mode;
        if (mode) {
            this.patchForm(this.motion);
            this.editNotificationSubscription = this.listenToEditNotification();
            this.sendEditNotification(MotionEditNotificationType.TYPE_BEGIN_EDITING_MOTION);
        }
        if (!mode && this.newMotion) {
            this.router.navigate(['./motions/']);
        }
        // If the user cancels the work on this motion,
        // notify the users who are still editing the same motion
        if (!mode && !this.newMotion) {
            this.unsubscribeEditNotifications(MotionEditNotificationType.TYPE_CLOSING_EDITING_MOTION);
        }
    }

    /**
     * Sets the default workflow ID during form creation
     */
    public updateWorkflowIdForCreateForm(paragraph?: number): void {
        const isStatuteAmendment = !!this.contentForm.get('statute_amendment').value && !!paragraph;
        const configKey = isStatuteAmendment ? 'motions_statute_amendments_workflow' : 'motions_workflow';
        const workflowId = this.configService.instant<string>(configKey);
        this.contentForm.patchValue({ workflow_id: +workflowId });
    }

    /**
     * If the checkbox is deactivated, the statute_paragraph_id-field needs to be reset, as only that field is saved
     *
     * @param {MatCheckboxChange} $event
     */
    public onStatuteAmendmentChange($event: MatCheckboxChange): void {
        this.contentForm.patchValue({
            statute_paragraph_id: null
        });
        this.updateWorkflowIdForCreateForm();
    }

    /**
     * The paragraph of the statute to amend was changed -> change the input fields below
     *
     * @param {number} newValue
     */
    public onStatuteParagraphChange(newValue: number): void {
        const selectedParagraph = this.statuteParagraphs.find(par => par.id === newValue);
        this.contentForm.patchValue({
            title: this.translate.instant('Statute amendment for') + ` ${selectedParagraph.title}`,
            text: selectedParagraph.text
        });
        this.updateWorkflowIdForCreateForm(newValue);
    }

    /**
     * Navigates the user to the given ViewMotion
     *
     * @param motion target
     */
    public navigateToMotion(motion: ViewMotion): void {
        if (motion) {
            this.router.navigate([`../${motion.id}`], { relativeTo: this.route.parent });
            // update the current motion
            this.motion = motion;
            this.setSurroundingMotions();
        }
    }

    /**
     * Sets the previous and next motion. Sorts by the current sorting as used
     * in the {@link MotionSortListService}
     */
    public setSurroundingMotions(): void {
        const indexOfCurrent = this.sortedMotions.findIndex(motion => {
            return motion === this.motion;
        });
        if (indexOfCurrent > -1) {
            if (indexOfCurrent > 0) {
                this.previousMotion = this.sortedMotions[indexOfCurrent - 1];
            } else {
                this.previousMotion = null;
            }
            if (indexOfCurrent < this.sortedMotions.length - 1) {
                this.nextMotion = this.sortedMotions[indexOfCurrent + 1];
            } else {
                this.nextMotion = null;
            }
            this.cd.markForCheck();
        }
    }

    /**
     * Supports the motion (as requested user)
     */
    public support(): void {
        this.repo.support(this.motion).catch(this.raiseError);
    }

    /**
     * Unsupports the motion
     */
    public unsupport(): void {
        this.repo.unsupport(this.motion).catch(this.raiseError);
    }

    /**
     * Opens the dialog with all supporters.
     * TODO: open dialog here!
     */
    public openSupportersDialog(): void {
        this.showSupporters = !this.showSupporters;
    }

    /**
     * Sets the state
     *
     * @param id Motion state id
     */
    public setState(id: number): void {
        this.repo.setState(this.motion, id).catch(this.raiseError);
    }

    /**
     * triggers the update this motion's state extension according to the current string
     * in {@link newStateExtension}
     */
    public setStateExtension(nextExtension: string): void {
        this.repo.setStateExtension(this.motion, nextExtension);
    }

    /**
     * Sets the recommendation
     *
     * @param id Motion recommendation id
     */
    public setRecommendation(id: number): void {
        this.repo.setRecommendation(this.motion, id);
    }

    /**
     * triggers the update this motion's recommendation extension according to the current string
     * in {@link newRecommendationExtension}
     */
    public setRecommendationExtension(nextExtension: string): void {
        this.repo.setRecommendationExtension(this.motion, nextExtension);
    }

    /**
     * Sets the category for current motion
     *
     * @param id Motion category id
     */
    public setCategory(id: number): void {
        if (id === this.motion.category_id) {
            id = null;
        }
        this.repo.setCatetory(this.motion, id).catch(this.raiseError);
    }

    /**
     * Adds or removes a tag to the current motion
     *
     * @param id Motion tag id
     */
    public setTag(event: MouseEvent, id: number): void {
        event.stopPropagation();
        this.repo.setTag(this.motion, id).catch(this.raiseError);
    }

    /**
     * Add the current motion to a motion block
     *
     * @param id Motion block id
     */
    public setBlock(id: number): void {
        if (id === this.motion.motion_block_id) {
            id = null;
        }
        this.repo.setBlock(this.motion, id).catch(this.raiseError);
    }

    /**
     * Observes the repository for changes in the motion recommender
     */
    public setupRecommender(): void {
        if (this.motion) {
            const configKey = this.motion.isStatuteAmendment()
                ? 'motions_statute_recommendations_by'
                : 'motions_recommendations_by';
            if (this.recommenderSubscription) {
                this.recommenderSubscription.unsubscribe();
            }
            this.recommenderSubscription = this.configService.get<string>(configKey).subscribe(recommender => {
                this.recommender = recommender;
            });
        }
    }

    /**
     * Click handler for the pdf button
     */
    public onDownloadPdf(): void {
        this.pdfExport.exportSingleMotion(this.motion, {
            lnMode: this.lnMode,
            crMode: this.crMode,
            comments: this.motion.commentSectionIds.concat([PERSONAL_NOTE_ID]) // export all comment fields as well as personal note
        });
    }

    /**
     * Click handler for attachments
     *
     * @param attachment the selected file
     */
    public onClickAttachment(attachment: Mediafile): void {
        window.open(attachment.url);
    }

    /**
     * Handler for creating a poll
     */
    public createPoll(): void {
        // TODO
        // this.repo.createPoll(<any>{}).catch(this.raiseError);
        throw new Error('TODO');
    }

    /**
     * Check if a recommendation can be followed. Checks for permissions and additionally if a recommentadion is present
     */
    public canFollowRecommendation(): boolean {
        if (
            this.perms.isAllowed('createpoll', this.motion) &&
            this.motion.recommendation &&
            this.motion.recommendation.recommendation_label
        ) {
            return true;
        }
        return false;
    }

    /**
     * Handler for the 'follow recommendation' button
     */
    public onFollowRecButton(): void {
        this.repo.followRecommendation(this.motion);
    }

    /**
     * Function to send a notification, so that other persons can recognize editing the same motion, if they're doing.
     *
     * @param type TypeOfNotificationViewMotion defines the type of the notification which is sent.
     * @param user Optional userId. If set the function will send a notification to the given userId.
     */
    private sendEditNotification(type: MotionEditNotificationType, user?: number): void {
        const content: MotionEditNotification = {
            motionId: this.motion.id,
            senderId: this.operator.viewUser.id,
            senderName: this.operator.viewUser.short_name,
            type: type
        };
        if (user) {
            this.notifyService.sendToUsers(this.NOTIFICATION_EDIT_MOTION, content, user);
        } else {
            this.notifyService.sendToAllUsers<MotionEditNotification>(this.NOTIFICATION_EDIT_MOTION, content);
        }
    }

    /**
     * Function to listen to notifications if the user edits this motion.
     * Handles the notification messages.
     *
     * @returns A subscription, only if the user wants to edit this motion, to listen to notifications.
     */
    private listenToEditNotification(): Subscription {
        return this.notifyService.getMessageObservable(this.NOTIFICATION_EDIT_MOTION).subscribe(message => {
            const content = <MotionEditNotification>message.content;
            if (this.operator.viewUser.id !== content.senderId && content.motionId === this.motion.id) {
                let warning = '';

                switch (content.type) {
                    case MotionEditNotificationType.TYPE_BEGIN_EDITING_MOTION:
                    case MotionEditNotificationType.TYPE_ALSO_EDITING_MOTION: {
                        if (!this.otherWorkOnMotion.includes(content.senderName)) {
                            this.otherWorkOnMotion.push(content.senderName);
                        }

                        warning = `${this.translate.instant('Following users are currently editing this motion:')} ${
                            this.otherWorkOnMotion
                        }`;
                        if (content.type === MotionEditNotificationType.TYPE_BEGIN_EDITING_MOTION) {
                            this.sendEditNotification(
                                MotionEditNotificationType.TYPE_ALSO_EDITING_MOTION,
                                message.senderUserId
                            );
                        }
                        break;
                    }
                    case MotionEditNotificationType.TYPE_CLOSING_EDITING_MOTION: {
                        this.recognizeOtherWorkerOnMotion(content.senderName);
                        break;
                    }
                    case MotionEditNotificationType.TYPE_SAVING_EDITING_MOTION: {
                        warning = `${content.senderName} ${this.translate.instant(
                            'has saved his work on this motion.'
                        )}`;
                        // Wait, to prevent overlapping snack bars
                        setTimeout(() => this.recognizeOtherWorkerOnMotion(content.senderName), 2000);
                        break;
                    }
                }

                if (warning !== '') {
                    this.raiseWarning(warning);
                }
            }
        });
    }

    /**
     * Function to handle leaving persons and
     * recognize if there is no other person editing the same motion anymore.
     *
     * @param senderId The id of the sender who has left the editing-view.
     */
    private recognizeOtherWorkerOnMotion(senderName: string): void {
        this.otherWorkOnMotion = this.otherWorkOnMotion.filter(value => value !== senderName);
        if (this.otherWorkOnMotion.length === 0) {
            this.closeSnackBar();
        }
    }

    /**
     * Function to unsubscribe the notification subscription.
     * Before unsubscribing a notification will send with the reason.
     *
     * @param unsubscriptionReason The reason for the unsubscription.
     */
    private unsubscribeEditNotifications(unsubscriptionReason: MotionEditNotificationType): void {
        if (this.editNotificationSubscription && !this.editNotificationSubscription.closed) {
            this.sendEditNotification(unsubscriptionReason);
            this.closeSnackBar();
            this.editNotificationSubscription.unsubscribe();
        }
    }

    /**
     * Submits the modified final version of the motion
     */
    public onSubmitFinalVersion(): void {
        const val = this.contentForm.get('modified_final_version').value;
        this.updateMotion({ modified_final_version: val }, this.motion).then(() => {
            this.finalEditMode = false;
            this.contentForm.get('modified_final_version').markAsPristine();
        }, this.raiseError);
    }

    /**
     * Cancels the final version edit and resets the form value
     *
     * TODO: the tinyMCE editor content should reset, too
     */
    public cancelFinalVersionEdit(): void {
        this.finalEditMode = false;
        this.contentForm.patchValue({ modified_final_version: this.motion.modified_final_version });
    }

    /**
     * Toggles the favorite status
     */
    public toggleFavorite(): void {
        if (!this.motion.personalNote) {
            this.motion.personalNote = {
                note: '',
                star: true
            };
        } else {
            this.motion.personalNote.star = !this.motion.personalNote.star;
        }
        this.personalNoteService.savePersonalNote(this.motion, this.motion.personalNote).catch(this.raiseError);
    }

    /**
     * Handler for upload errors
     *
     * @param error the error message passed by the upload component
     */
    public showUploadError(error: string): void {
        this.raiseError(error);
    }

    /**
     * Tries to determine the previous URL if it's considered unsafe
     *
     * @returns the target to navigate to
     */
    public getPrevUrl(): string {
        if (this.motion && this.motion.parent_id) {
            if (this.routingStateService.previousUrl && this.routingStateService.isSafePrevUrl) {
                if (
                    (this.previousMotion &&
                        this.routingStateService.previousUrl === this.previousMotion.getDetailStateURL()) ||
                    (this.nextMotion && this.routingStateService.previousUrl === this.nextMotion.getDetailStateURL())
                ) {
                    return '../..';
                } else {
                    return this.routingStateService.previousUrl;
                }
            } else {
                return this.motion.parent.getDetailStateURL();
            }
        }
        return '../..';
    }

    /**
     * Function to prevent automatically closing the window/tab,
     * if the user is editing a motion.
     *
     * @param $event The event object from 'onUnbeforeUnload'.
     */
    @HostListener('window:beforeunload', ['$event'])
    public stopClosing($event: Event): void {
        if (this.editMotion) {
            $event.returnValue = null;
        }
    }

    public swipe(e: TouchEvent, when: string): void {
        const coord: [number, number] = [e.changedTouches[0].pageX, e.changedTouches[0].pageY];
        const time = new Date().getTime();
        if (when === 'start') {
            this.swipeCoord = coord;
            this.swipeTime = time;
        } else if (when === 'end') {
            const direction = [coord[0] - this.swipeCoord[0], coord[1] - this.swipeCoord[1]];
            const duration = time - this.swipeTime;

            if (
                duration < 1000 &&
                Math.abs(direction[0]) > 30 && // swipe length to be detected
                Math.abs(direction[0]) > Math.abs(direction[1] * 3) // 30° should be "horizontal enough"
            ) {
                if (
                    direction[0] > 0 // swipe left to right
                ) {
                    this.navigateToMotion(this.previousMotion);
                }

                if (
                    direction[0] < 0 // swipe left to right
                ) {
                    this.navigateToMotion(this.nextMotion);
                }
            }
        }
    }

    /**
     * Activates the 'edit final version' mode
     */
    public editModifiedFinal(): void {
        this.finalEditMode = true;
    }

    public addToAgenda(): void {
        this.itemRepo.addItemToAgenda(this.motion).catch(this.raiseError);
    }

    public removeFromAgenda(): void {
        this.itemRepo.removeFromAgenda(this.motion.item).catch(this.raiseError);
    }
}
