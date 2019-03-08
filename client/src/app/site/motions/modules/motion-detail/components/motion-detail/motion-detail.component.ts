import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, OnDestroy, ElementRef, HostListener, TemplateRef } from '@angular/core';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialog, MatSnackBar, MatCheckboxChange, ErrorStateMatcher } from '@angular/material';

import { BehaviorSubject, Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { BaseViewComponent } from 'app/site/base/base-view';
import { CategoryRepositoryService } from 'app/core/repositories/motions/category-repository.service';
import { ChangeRecommendationRepositoryService } from 'app/core/repositories/motions/change-recommendation-repository.service';
import { CreateMotion } from 'app/site/motions/models/create-motion';
import { ConfigService } from 'app/core/ui-services/config.service';
import { DataStoreService } from 'app/core/core-services/data-store.service';
import { DiffLinesInParagraph, LineRange } from 'app/core/ui-services/diff.service';
import { ItemRepositoryService } from 'app/core/repositories/agenda/item-repository.service';
import { itemVisibilityChoices, Item } from 'app/shared/models/agenda/item';
import { LinenumberingService } from 'app/core/ui-services/linenumbering.service';
import { LocalPermissionsService } from 'app/site/motions/services/local-permissions.service';
import { Mediafile } from 'app/shared/models/mediafiles/mediafile';
import { Motion } from 'app/shared/models/motions/motion';
import { MotionBlock } from 'app/shared/models/motions/motion-block';
import {
    MotionChangeRecommendationComponentData,
    MotionChangeRecommendationComponent
} from '../motion-change-recommendation/motion-change-recommendation.component';
import { MotionPdfExportService } from 'app/site/motions/services/motion-pdf-export.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { NotifyService } from 'app/core/core-services/notify.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { PersonalNoteContent } from 'app/shared/models/users/personal-note';
import { PersonalNoteService } from 'app/core/ui-services/personal-note.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { StatuteParagraphRepositoryService } from 'app/core/repositories/motions/statute-paragraph-repository.service';
import { Tag } from 'app/shared/models/core/tag';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { ViewMotionBlock } from 'app/site/motions/models/view-motion-block';
import { ViewWorkflow } from 'app/site/motions/models/view-workflow';
import { ViewUser } from 'app/site/users/models/view-user';
import { ViewCategory } from 'app/site/motions/models/view-category';
import { ViewCreateMotion } from 'app/site/motions/models/view-create-motion';
import { ViewItem } from 'app/site/agenda/models/view-item';
import { ViewportService } from 'app/core/ui-services/viewport.service';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { ViewMotionChangeRecommendation } from 'app/site/motions/models/view-change-recommendation';
import {
    ViewMotionNotificationEditMotion,
    TypeOfNotificationViewMotion
} from 'app/site/motions/models/view-motion-notify';
import { ViewMotion, ChangeRecoMode, LineNumberingMode } from 'app/site/motions/models/view-motion';
import { ViewStatuteParagraph } from 'app/site/motions/models/view-statute-paragraph';
import { ViewTag } from 'app/site/tags/models/view-tag';
import { ViewUnifiedChange } from 'app/shared/models/motions/view-unified-change';
import { Workflow } from 'app/shared/models/motions/workflow';

/**
 * Component for the motion detail view
 */
@Component({
    selector: 'os-motion-detail',
    templateUrl: './motion-detail.component.html',
    styleUrls: ['./motion-detail.component.scss']
})
export class MotionDetailComponent extends BaseViewComponent implements OnInit, OnDestroy {
    /**
     * Motion content. Can be a new version
     */
    public contentForm: FormGroup;

    /**
     * To search other motions as extension via search value selector
     */
    public recommendationExtensionForm: FormGroup;

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
     * Value of the config variable `motions_reason_required`
     */
    public reasonRequired: boolean;

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
     * Copy of the motion that the user might edit
     */
    public motionCopy: ViewMotion;

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
    public allChangingObjects: ViewUnifiedChange[];

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
     * Subject for mediafiles
     */
    public mediafilesObserver: BehaviorSubject<ViewMediafile[]>;

    /**
     * Subject for agenda items
     */
    public agendaItemObserver: BehaviorSubject<ViewItem[]>;

    /**
     * Subject for tags
     */
    public tagObserver: BehaviorSubject<ViewTag[]>;

    /**
     * Subject for (other) motions
     */
    public motionObserver: BehaviorSubject<ViewMotion[]>;

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
     * Determines the default agenda item visibility
     */
    public defaultVisibility: number;

    /**
     * Determine visibility states for the agenda that will be created implicitly
     */
    public itemVisibility = itemVisibilityChoices;

    /**
     * For using the enum constants from the template
     */
    public ChangeRecoMode = ChangeRecoMode;

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
     * The personal notes' content for this motion
     */
    public personalNoteContent: PersonalNoteContent;

    /**
     * new state extension label to be submitted, if state extensions can be set
     */
    public newStateExtension = '';

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
     * @param agendaRepo Read out agenda variables
     * @param changeRecoRepo Change Recommendation Repository
     * @param statuteRepo: Statute Paragraph Repository
     * @param DS The DataStoreService
     * @param configService The configuration provider
     * @param sanitizer For making HTML SafeHTML
     * @param promptService ensure safe deletion
     * @param pdfExport export the motion to pdf
     * @param personalNoteService: personal comments and favorite marker
     * @param linenumberingService The line numbering service
     * @param categoryRepo Repository for categories
     * @param viewModelStore accessing view models
     * @param categoryRepo access the category repository
     * @param userRepo Repository for users
     * @param notifyService: NotifyService work with notification
     */
    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        public vp: ViewportService,
        private operator: OperatorService,
        public perms: LocalPermissionsService,
        private router: Router,
        private route: ActivatedRoute,
        private formBuilder: FormBuilder,
        private dialogService: MatDialog,
        private el: ElementRef,
        public repo: MotionRepositoryService,
        private agendaRepo: ItemRepositoryService,
        private changeRecoRepo: ChangeRecommendationRepositoryService,
        private statuteRepo: StatuteParagraphRepositoryService,
        private DS: DataStoreService,
        private configService: ConfigService,
        private sanitizer: DomSanitizer,
        private promptService: PromptService,
        private pdfExport: MotionPdfExportService,
        private personalNoteService: PersonalNoteService,
        private linenumberingService: LinenumberingService,
        private viewModelStore: ViewModelStoreService,
        private categoryRepo: CategoryRepositoryService,
        private userRepo: UserRepositoryService,
        private notifyService: NotifyService
    ) {
        super(title, translate, matSnackBar);

        this.workflowObserver = new BehaviorSubject(this.viewModelStore.getAll(ViewWorkflow));
        this.blockObserver = new BehaviorSubject(this.viewModelStore.getAll(ViewMotionBlock));
        this.mediafilesObserver = new BehaviorSubject(this.viewModelStore.getAll(ViewMediafile));
        this.agendaItemObserver = new BehaviorSubject(this.viewModelStore.getAll(ViewItem));
        this.tagObserver = new BehaviorSubject(this.viewModelStore.getAll(ViewTag));
        this.motionObserver = new BehaviorSubject(this.viewModelStore.getAll(ViewMotion));

        // Make sure the subjects are updated, when a new Model for the type arrives
        // TODO get rid of DS here
        this.DS.changeObservable.subscribe(newModel => {
            if (newModel instanceof Workflow) {
                this.workflowObserver.next(this.viewModelStore.getAll(ViewWorkflow));
            } else if (newModel instanceof MotionBlock) {
                this.blockObserver.next(this.viewModelStore.getAll(ViewMotionBlock));
            } else if (newModel instanceof Mediafile) {
                this.mediafilesObserver.next(this.viewModelStore.getAll(ViewMediafile));
            } else if (newModel instanceof Item) {
                this.agendaItemObserver.next(this.viewModelStore.getAll(ViewItem));
            } else if (newModel instanceof Tag) {
                this.tagObserver.next(this.viewModelStore.getAll(ViewTag));
            } else if (newModel instanceof Motion) {
                this.motionObserver.next(this.viewModelStore.getAll(ViewMotion));
                this.setSurroundingMotions();
            }
        });

        // load config variables
        this.configService
            .get<boolean>('motions_statutes_enabled')
            .subscribe(enabled => (this.statutesEnabled = enabled));
        this.configService
            .get<boolean>('motions_reason_required')
            .subscribe(required => (this.reasonRequired = required));
        this.configService
            .get<number>('motions_min_supporters')
            .subscribe(supporters => (this.minSupporters = supporters));
        this.configService.get<string>('motions_preamble').subscribe(preamble => (this.preamble = preamble));
        this.configService
            .get<boolean>('motions_amendments_enabled')
            .subscribe(enabled => (this.amendmentsEnabled = enabled));
        this.configService.get<number>('motions_line_length').subscribe(lineLength => (this.lineLength = lineLength));
        this.configService
            .get<LineNumberingMode>('motions_default_line_numbering')
            .subscribe(mode => (this.lnMode = mode));
        this.configService
            .get<ChangeRecoMode>('motions_recommendation_text_mode')
            .subscribe(mode => (this.crMode = mode));
    }

    /**
     * Init.
     * Sets the surrounding motions to navigate back and forth
     */
    public ngOnInit(): void {
        this.createForm();
        this.getMotionByUrl();
        this.setSurroundingMotions();

        // TODO: Changed to un-sort, since it's a really heavy operation
        this.userRepo.getViewModelListObservable().subscribe(unsortedUsers => {
            this.submitterObserver.next(unsortedUsers);
            this.supporterObserver.next(unsortedUsers);
        });

        this.categoryRepo.getViewModelListObservable().subscribe(unsortedCategories => {
            this.categoryObserver.next(unsortedCategories);
        });

        // Initial Filling of the Subjects
        this.submitterObserver = new BehaviorSubject(this.userRepo.getViewModelList());
        this.supporterObserver = new BehaviorSubject(this.userRepo.getViewModelList());
        this.categoryObserver = new BehaviorSubject(
            this.categoryRepo.sortViewCategoriesByConfig(this.viewModelStore.getAll(ViewCategory))
        );

        this.statuteRepo.getViewModelListObservable().subscribe(newViewStatuteParagraphs => {
            this.statuteParagraphs = newViewStatuteParagraphs;
        });

        // Set the default visibility using observers
        this.agendaRepo.getDefaultAgendaVisibility().subscribe(visibility => {
            if (visibility && this.newMotion) {
                this.contentForm.get('agenda_type').setValue(visibility);
            }
        });

        // disable the selector for attachments if there are none
        this.mediafilesObserver.subscribe(files => {
            if (this.createForm) {
                const attachmentsCtrl = this.contentForm.get('attachments_id');
                if (this.mediafilesObserver.value.length === 0) {
                    attachmentsCtrl.disable();
                } else {
                    attachmentsCtrl.enable();
                }
            }
        });
    }

    /**
     * Called during view destruction.
     * Sends a notification to user editors of the motion was edited
     */
    public ngOnDestroy(): void {
        this.unsubscribeEditNotifications(TypeOfNotificationViewMotion.TYPE_CLOSING_EDITING_MOTION);
    }

    /**
     * Merges amendments and change recommendations and sorts them by the line numbers.
     * Called each time one of these arrays changes.
     *
     * TODO: 1. Having logic in a service is bad practice
     *       2. Manipulating class parameters without an subscription should
     *          be avoided. It's safer and simpler to return values than to manipulate the scope
     */
    private recalcUnifiedChanges(): void {
        this.allChangingObjects = [];
        if (this.changeRecommendations) {
            this.changeRecommendations.forEach(
                (change: ViewUnifiedChange): void => {
                    this.allChangingObjects.push(change);
                }
            );
        }
        if (this.amendments) {
            this.amendments.forEach(
                (amendment: ViewMotion): void => {
                    this.repo.getAmendmentAmendedParagraphs(amendment, this.lineLength).forEach(
                        (change: ViewUnifiedChange): void => {
                            this.allChangingObjects.push(change);
                        }
                    );
                }
            );
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
    }

    /**
     * determine the motion to display using the URL
     */
    public getMotionByUrl(): void {
        this.route.params.subscribe(params => {
            if (Object.keys(params).length > 0) {
                // load existing motion
                const motionId: number = +params.id;
                this.repo.getViewModelObservable(motionId).subscribe(newViewMotion => {
                    if (newViewMotion) {
                        this.motion = newViewMotion;
                        this.newStateExtension = this.motion.stateExtension;
                        this.personalNoteService.getPersonalNoteObserver(this.motion.motion).subscribe(pn => {
                            this.personalNoteContent = pn;
                        });
                        this.patchForm(this.motion);
                    }
                });
                this.repo.amendmentsTo(motionId).subscribe(
                    (amendments: ViewMotion[]): void => {
                        this.amendments = amendments;
                        this.recalcUnifiedChanges();
                    }
                );
                this.changeRecoRepo
                    .getChangeRecosOfMotionObservable(motionId)
                    .subscribe((recos: ViewMotionChangeRecommendation[]) => {
                        this.changeRecommendations = recos;
                        this.recalcUnifiedChanges();
                    });
            } else {
                // creates a new motion
                this.newMotion = true;
                this.editMotion = true;
                // prevent 'undefined' to appear in the ui
                const defaultMotion: Partial<CreateMotion> = {
                    title: '',
                    origin: '',
                    identifier: ''
                };
                if (this.route.snapshot.queryParams.parent) {
                    this.amendmentEdit = true;
                    const parentMotion = this.repo.getViewModel(this.route.snapshot.queryParams.parent);
                    const defaultTitle = `${this.translate.instant('Amendment to')} ${parentMotion.identifierOrTitle}`;
                    const mode = this.configService.instant<string>('motions_amendments_text_mode');
                    if (mode === 'freestyle' || mode === 'fulltext') {
                        defaultMotion.title = defaultTitle;
                        defaultMotion.parent_id = parentMotion.id;
                        defaultMotion.category_id = parentMotion.category_id;
                        defaultMotion.motion_block_id = parentMotion.motion_block_id;
                        this.contentForm.patchValue({
                            title: defaultTitle,
                            category_id: parentMotion.category_id,
                            motion_block_id: parentMotion.motion_block_id,
                            parent_id: parentMotion.id
                        });
                    }
                    if (mode === 'fulltext') {
                        defaultMotion.text = parentMotion.text;
                        this.contentForm.patchValue({ text: parentMotion.text });
                    }
                }
                this.motion = new ViewCreateMotion(new CreateMotion(defaultMotion));
                this.motionCopy = new ViewCreateMotion(new CreateMotion(defaultMotion));
            }
        });
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
            contentPatch.text = formMotion.amendment_paragraphs.find(
                (para: string): boolean => {
                    return para !== null;
                }
            );
        }

        const statuteAmendmentFieldName = 'statute_amendment';
        contentPatch[statuteAmendmentFieldName] = formMotion.isStatuteAmendment();
        this.contentForm.patchValue(contentPatch);
        this.recommendationExtensionForm.get('recoExtension').setValue(this.motion.recommendationExtension);
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
            agenda_parent_id: [],
            agenda_type: [''],
            submitters_id: [],
            supporters_id: [[]],
            workflow_id: [],
            origin: [''],
            statute_amendment: [''], // Internal value for the checkbox, not saved to the model
            statute_paragraph_id: [''],
            motion_block_id: [],
            parent_id: []
        });
        this.updateWorkflowIdForCreateForm();

        const component = this;
        this.highlightedLineMatcher = new class implements ErrorStateMatcher {
            public isErrorState(control: FormControl): boolean {
                const value: string = control && control.value ? control.value + '' : '';
                const maxLineNumber = component.repo.getLastLineNumber(component.motion, component.lineLength);
                return value.match(/[^\d]/) !== null || parseInt(value, 10) >= maxLineNumber;
            }
        }();

        // create the search motion form
        this.recommendationExtensionForm = this.formBuilder.group({
            motion_id: [],
            recoExtension: []
        });

        // Detect changes in in search motion form
        this.recommendationExtensionForm.get('motion_id').valueChanges.subscribe(change => {
            this.addMotionExtension(change);
        });
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
                (paragraph: string): string => {
                    if (paragraph === null) {
                        return null;
                    } else {
                        return motionValues.text;
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
        this.updateMotion(newMotionValues, this.motionCopy).then(() => {
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
            this.unsubscribeEditNotifications(TypeOfNotificationViewMotion.TYPE_SAVING_EDITING_MOTION);
        }
    }

    /**
     * get the formated motion text from the repository.
     *
     * @returns formated motion texts
     */
    public getFormattedTextPlain(): string {
        // Prevent this.allChangingObjects to be reordered from within formatMotion
        const changes: ViewUnifiedChange[] = Object.assign([], this.allChangingObjects);
        return this.repo.formatMotion(this.motion.id, this.crMode, changes, this.lineLength, this.highlightedLine);
    }

    /**
     * Called from the template to make a HTML string compatible with [innerHTML]
     * (otherwise line-number-data-attributes would be stripped out)
     *
     * @param {string} text
     * @returns {SafeHtml}
     */
    public sanitizedText(text: string): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(text);
    }

    /**
     * If `this.motion` is an amendment, this returns the list of all changed paragraphs.
     *
     * @returns {DiffLinesInParagraph[]}
     */
    public getAmendedParagraphs(): DiffLinesInParagraph[] {
        return this.repo.getAmendedParagraphs(this.motion, this.lineLength);
    }

    /**
     * If `this.motion` is an amendment, this returns a specified line range from the parent motion
     * (e.g. to show the contect in which this amendment is happening)
     *
     * @param from the line number to start
     * @param to the line number to stop
     * @returns safe html strings
     */
    public getParentMotionRange(from: number, to: number): SafeHtml {
        const str = this.repo.extractMotionLineRange(
            this.motion.parent_id,
            { from, to },
            true,
            this.lineLength,
            this.highlightedLine
        );
        return this.sanitizer.bypassSecurityTrustHtml(str);
    }

    /**
     * get the diff html from the statute amendment, as SafeHTML for [innerHTML]
     *
     * @returns safe html strings
     */
    public getFormattedStatuteAmendment(): SafeHtml {
        const diffHtml = this.repo.formatStatuteAmendment(this.statuteParagraphs, this.motion, this.lineLength);
        return this.sanitizer.bypassSecurityTrustHtml(diffHtml);
    }

    /**
     * Trigger to delete the motion.
     */
    public async deleteMotionButton(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this motion?');
        if (await this.promptService.open(title, this.motion.getTitle())) {
            await this.repo.delete(this.motion);
            this.router.navigate(['./motions/']);
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
            const target = element.querySelector('.os-line-number.line-number-' + line.toString(10));
            target.scrollIntoView({ behavior: 'smooth' });
        }, 1);
    }

    /**
     * In the original version, a line number range has been selected in order to create a new change recommendation
     *
     * @param lineRange
     */
    public createChangeRecommendation(lineRange: LineRange): void {
        const data: MotionChangeRecommendationComponentData = {
            editChangeRecommendation: false,
            newChangeRecommendation: true,
            lineRange: lineRange,
            changeRecommendation: this.repo.createChangeRecommendationTemplate(
                this.motion.id,
                lineRange,
                this.lineLength
            )
        };
        this.dialogService.open(MotionChangeRecommendationComponent, {
            height: '400px',
            width: '600px',
            data: data,
            disableClose: true
        });
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
            this.router.navigate(['./motions/new'], {
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
        const changes: ViewUnifiedChange[] = Object.assign([], this.allChangingObjects);
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
                const content = this.translate.instant('Are you sure to copy the final version to the print template?');
                if (await this.promptService.open(this.motion.title, content)) {
                    await this.updateMotion({ modified_final_version: finalVersion }, this.motion);
                }
            } else {
                await this.updateMotion({ modified_final_version: finalVersion }, this.motion);
            }
        } catch (e) {
            this.raiseError(e);
        }
        this.setChangeRecoMode(ChangeRecoMode.ModifiedFinal);
    }

    /**
     * Deletes the modified final version
     */
    public async deleteModifiedFinalVersion(): Promise<void> {
        const content = this.translate.instant('Are you sure to delete the print template?');
        if (await this.promptService.open(this.motion.title, content)) {
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
            this.motionCopy = this.motion.copy();
            this.patchForm(this.motionCopy);
            this.editNotificationSubscription = this.listenToEditNotification();
            this.sendEditNotification(TypeOfNotificationViewMotion.TYPE_BEGIN_EDITING_MOTION);
        }
        if (!mode && this.newMotion) {
            this.router.navigate(['./motions/']);
        }
        // If the user cancels the work on this motion,
        // notify the users who are still editing the same motion
        if (!mode && !this.newMotion) {
            this.unsubscribeEditNotifications(TypeOfNotificationViewMotion.TYPE_CLOSING_EDITING_MOTION);
        }
    }

    /**
     * Sets the default workflow ID during form creation
     */
    public updateWorkflowIdForCreateForm(): void {
        const isStatuteAmendment = !!this.contentForm.get('statute_amendment').value;
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
    }

    /**
     * Navigates the user to the given ViewMotion
     *
     * @param motion target
     */
    public navigateToMotion(motion: ViewMotion): void {
        if (motion) {
            this.router.navigate(['../contacts'], { relativeTo: this.route.parent });
            // update the current motion
            this.motion = motion;
            this.setSurroundingMotions();
        }
    }

    /**
     * Sets the previous and next motion. Sorts ascending by identifier, and
     * then appending motion without identifiers sorted by title
     */
    public setSurroundingMotions(): void {
        // TODO: that operation is HEAVY
        this.motionObserver.value.sort((a, b) => {
            if (a.identifier && b.identifier) {
                return a.identifier.localeCompare(b.identifier, this.translate.currentLang);
            } else if (a.identifier) {
                return 1;
            } else if (b.identifier) {
                return -1;
            } else {
                return a.title.localeCompare(b.title, this.translate.currentLang);
            }
        });
        const indexOfCurrent = this.motionObserver.value.findIndex(motion => {
            return motion === this.motion;
        });
        if (indexOfCurrent > -1) {
            if (indexOfCurrent > 0) {
                this.previousMotion = this.motionObserver.value[indexOfCurrent - 1];
            } else {
                this.previousMotion = null;
            }

            if (indexOfCurrent < this.motionObserver.value.length - 1) {
                this.nextMotion = this.motionObserver.value[indexOfCurrent + 1];
            } else {
                this.nextMotion = null;
            }
        }
    }

    /**
     * Supports the motion (as requested user)
     */
    public support(): void {
        this.repo.support(this.motion).then(null, this.raiseError);
    }

    /**
     * Unsupports the motion
     */
    public unsupport(): void {
        this.repo.unsupport(this.motion).then(null, this.raiseError);
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
        this.repo.setState(this.motion, id).then(null, this.raiseError);
    }

    /**
     * triggers the update this motion's state extension according to the current string
     * in {@link newStateExtension}
     */
    public setStateExtension(): void {
        this.repo.setStateExtension(this.motion, this.newStateExtension);
    }

    /**
     * Adds an extension in the shape: [Motion:id] to the recoExtension form control
     *
     * @param id the ID of a selected motion returned by a search value selector
     */
    public addMotionExtension(id: number): void {
        const recoExtensionValue = this.recommendationExtensionForm.get('recoExtension').value || '';
        this.recommendationExtensionForm.get('recoExtension').setValue(`${recoExtensionValue}[motion:${id}]`);
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
    public setRecommendationExtension(): void {
        this.repo.setRecommendationExtension(this.motion, this.recommendationExtensionForm.get('recoExtension').value);
    }

    /**
     * Sets the category for current motion
     *
     * @param id Motion category id
     */
    public setCategory(id: number): void {
        if (id === this.motion.category_id) {
            this.repo.setCatetory(this.motion, null);
        } else {
            this.repo.setCatetory(this.motion, id);
        }
    }

    /**
     * Adds or removes a tag to the current motion
     *
     * @param id Motion tag id
     */
    public setTag(event: MouseEvent, id: number): void {
        event.stopPropagation();
        this.repo.setTag(this.motion, id);
    }

    /**
     * Add the current motion to a motion block
     *
     * @param id Motion block id
     */
    public setBlock(id: number): void {
        if (id === this.motion.motion_block_id) {
            this.repo.setBlock(this.motion, null);
        } else {
            this.repo.setBlock(this.motion, id);
        }
    }

    /**
     * Observes the repository for changes in the motion recommender
     */
    public setupRecommender(): void {
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

    /**
     * Create the absolute path to the corresponding list of speakers
     *
     * @returns the link to the corresponding list of speakers as string
     */
    public getSpeakerLink(): string {
        return `/agenda/${this.motion.agenda_item_id}/speakers`;
    }

    /**
     * Click handler for the pdf button
     */
    public onDownloadPdf(): void {
        // TODO: apparently statue amendments never have line numbers and are always in crMode
        if (this.motion.isStatuteAmendment()) {
            this.pdfExport.exportSingleMotion(this.motion, LineNumberingMode.None, ChangeRecoMode.Diff);
        } else {
            this.pdfExport.exportSingleMotion(this.motion, this.lnMode, this.crMode);
        }
    }

    /**
     * Click handler for attachments
     *
     * @param attachment the selected file
     */
    public onClickAttacment(attachment: Mediafile): void {
        window.open(attachment.downloadUrl);
    }

    /**
     * Handler for creating a poll
     */
    public async createPoll(): Promise<void> {
        await this.repo.createPoll(this.motion);
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
    private sendEditNotification(type: TypeOfNotificationViewMotion, user?: number): void {
        const content: ViewMotionNotificationEditMotion = {
            motionId: this.motion.id,
            senderId: this.operator.viewUser.id,
            senderName: this.operator.viewUser.short_name,
            type: type
        };
        if (user) {
            this.notifyService.sendToUsers(this.NOTIFICATION_EDIT_MOTION, content, user);
        } else {
            this.notifyService.sendToAllUsers<ViewMotionNotificationEditMotion>(this.NOTIFICATION_EDIT_MOTION, content);
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
            const content = <ViewMotionNotificationEditMotion>message.content;
            if (this.operator.viewUser.id !== content.senderId && content.motionId === this.motion.id) {
                let warning = '';

                switch (content.type) {
                    case TypeOfNotificationViewMotion.TYPE_BEGIN_EDITING_MOTION:
                    case TypeOfNotificationViewMotion.TYPE_ALSO_EDITING_MOTION: {
                        if (!this.otherWorkOnMotion.includes(content.senderName)) {
                            this.otherWorkOnMotion.push(content.senderName);
                        }

                        warning = `${this.translate.instant('Following users are currently editing this motion:')} ${
                            this.otherWorkOnMotion
                        }`;
                        if (content.type === TypeOfNotificationViewMotion.TYPE_BEGIN_EDITING_MOTION) {
                            this.sendEditNotification(
                                TypeOfNotificationViewMotion.TYPE_ALSO_EDITING_MOTION,
                                message.senderUserId
                            );
                        }
                        break;
                    }
                    case TypeOfNotificationViewMotion.TYPE_CLOSING_EDITING_MOTION: {
                        this.recognizeOtherWorkerOnMotion(content.senderName);
                        break;
                    }
                    case TypeOfNotificationViewMotion.TYPE_SAVING_EDITING_MOTION: {
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
    private unsubscribeEditNotifications(unsubscriptionReason: TypeOfNotificationViewMotion): void {
        if (!!this.editNotificationSubscription && !this.editNotificationSubscription.closed) {
            this.sendEditNotification(unsubscriptionReason);
            this.closeSnackBar();
            this.editNotificationSubscription.unsubscribe();
        }
    }

    /**
     * Toggles the favorite status
     */
    public async toggleFavorite(): Promise<void> {
        this.personalNoteService.setPersonalNoteStar(this.motion.motion, !this.motion.star);
    }

    /**
     * Handler for the upload attachments button
     */
    public onUploadAttachmentsButton(templateRef: TemplateRef<string>): void {
        this.dialogService.open(templateRef, {
            maxHeight: '90vh',
            width: '750px',
            maxWidth: '90vw'
        });
    }

    /**
     * Handler for successful uploads.
     * Adds the IDs of the upload process to the mediafile selector
     *
     * @param fileIds the ids of the uploads if they were successful
     */
    public uploadSuccess(fileIds: number[]): void {
        const currentAttachments = this.contentForm.get('attachments_id').value as number[];
        const newAttachments = [...currentAttachments, ...fileIds];
        this.contentForm.get('attachments_id').setValue(newAttachments);
        this.dialogService.closeAll();
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
}
