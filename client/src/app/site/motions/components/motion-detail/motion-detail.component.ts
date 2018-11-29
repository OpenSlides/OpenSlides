import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatExpansionPanel, MatSnackBar, MatCheckboxChange } from '@angular/material';

import { Category } from '../../../../shared/models/motions/category';
import { ViewportService } from '../../../../core/services/viewport.service';
import { MotionRepositoryService } from '../../services/motion-repository.service';
import { ChangeRecoMode, LineNumberingMode, ViewMotion } from '../../models/view-motion';
import { User } from '../../../../shared/models/users/user';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { TranslateService } from '@ngx-translate/core';
import { Motion } from '../../../../shared/models/motions/motion';
import { BehaviorSubject, Subscription, ReplaySubject, concat } from 'rxjs';
import { LineRange } from '../../services/diff.service';
import {
    MotionChangeRecommendationComponent,
    MotionChangeRecommendationComponentData
} from '../motion-change-recommendation/motion-change-recommendation.component';
import { ChangeRecommendationRepositoryService } from '../../services/change-recommendation-repository.service';
import { ViewChangeReco } from '../../models/view-change-reco';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';
import { ViewUnifiedChange } from '../../models/view-unified-change';
import { OperatorService } from '../../../../core/services/operator.service';
import { BaseViewComponent } from '../../../base/base-view';
import { ViewStatuteParagraph } from '../../models/view-statute-paragraph';
import { StatuteParagraphRepositoryService } from '../../services/statute-paragraph-repository.service';
import { ConfigService } from '../../../../core/services/config.service';
import { Workflow } from 'app/shared/models/motions/workflow';
import { take, takeWhile, multicast, skipWhile } from 'rxjs/operators';
import { LocalPermissionsService } from '../../services/local-permissions.service';

/**
 * Component for the motion detail view
 */
@Component({
    selector: 'os-motion-detail',
    templateUrl: './motion-detail.component.html',
    styleUrls: ['./motion-detail.component.scss']
})
export class MotionDetailComponent extends BaseViewComponent implements OnInit {
    /**
     * MatExpansionPanel for the meta info
     * Only relevant in mobile view
     */
    @ViewChild('metaInfoPanel')
    public metaInfoPanel: MatExpansionPanel;

    /**
     * MatExpansionPanel for the content panel
     * Only relevant in mobile view
     */
    @ViewChild('contentPanel')
    public contentPanel: MatExpansionPanel;

    /**
     * Motions meta-info
     */
    public metaInfoForm: FormGroup;

    /**
     * Motion content. Can be a new version
     */
    public contentForm: FormGroup;

    /**
     * Determine if the motion is edited
     */
    public editMotion = false;

    /**
     * Determine if the motion is new
     */
    public newMotion = false;

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
     * Saves the target motion. Accessed via the getter and setter.
     */
    private _motion: ViewMotion;

    /**
     * Value of the config variable `motions_statutes_enabled` - are statutes enabled?
     * @TODO replace by direct access to config variable, once it's available from the templates
     */
    public statutesEnabled: boolean;

    /**
     * Value of the config variable `motions_min_supporters`
     */
    public minSupporters: number;

    /**
     * Value of the config variable `motions_preamble`
     */
    public preamble: string;


    /**
     * Copy of the motion that the user might edit
     */
    public motionCopy: ViewMotion;

    /**
     * All change recommendations to this motion
     */
    public changeRecommendations: ViewChangeReco[];

    /**
     * All change recommendations AND amendments, sorted by line number.
     */
    public allChangingObjects: ViewUnifiedChange[];

    /**
     * Holds all motions. Required to navigate back and forth
     */
    public allMotions: ViewMotion[];

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
    public categoryObserver: BehaviorSubject<Category[]>;

    /**
     * Subject for the Categories
     */
    public workflowObserver: BehaviorSubject<Workflow[]>;

    /**
     * Subject for the Submitters
     */
    public submitterObserver: BehaviorSubject<User[]>;

    /**
     * Subject for the Supporters
     */
    public supporterObserver: BehaviorSubject<User[]>;

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
     * Constuct the detail view.
     *
     * @param title
     * @param translate
     * @param matSnackBar
     * @param vp the viewport service
     * @param op Operator Service
     * @param router to navigate back to the motion list and to an existing motion
     * @param route determine if this is a new or an existing motion
     * @param formBuilder For reactive forms. Form Group and Form Control
     * @param dialogService For opening dialogs
     * @param repo Motion Repository
     * @param changeRecoRepo Change Recommendation Repository
     * @param statuteRepo: Statute Paragraph Repository
     * @param DS The DataStoreService
     * @param configService The configuration provider
     * @param sanitizer For making HTML SafeHTML
     */
    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        public vp: ViewportService,
        public perms: LocalPermissionsService,
        private op: OperatorService,
        private router: Router,
        private route: ActivatedRoute,
        private formBuilder: FormBuilder,
        private dialogService: MatDialog,
        private repo: MotionRepositoryService,
        private changeRecoRepo: ChangeRecommendationRepositoryService,
        private statuteRepo: StatuteParagraphRepositoryService,
        private DS: DataStoreService,
        private configService: ConfigService,
        private sanitizer: DomSanitizer
    ) {
        super(title, translate, matSnackBar);
        this.createForm();
        this.getMotionByUrl();

        // Initial Filling of the Subjects
        this.submitterObserver = new BehaviorSubject(DS.getAll(User));
        this.supporterObserver = new BehaviorSubject(DS.getAll(User));
        this.categoryObserver = new BehaviorSubject(DS.getAll(Category));
        this.workflowObserver = new BehaviorSubject(DS.getAll(Workflow));

        // Make sure the subjects are updated, when a new Model for the type arrives
        this.DS.changeObservable.subscribe(newModel => {
            if (newModel instanceof User) {
                this.submitterObserver.next(DS.getAll(User));
                this.supporterObserver.next(DS.getAll(User));
            } else if (newModel instanceof Category) {
                this.categoryObserver.next(DS.getAll(Category));
            } else if (newModel instanceof Workflow) {
                this.workflowObserver.next(DS.getAll(Workflow));
            }
        });
        // load config variables
        this.configService.get('motions_statutes_enabled').subscribe(
            (enabled: boolean): void => {
                this.statutesEnabled = enabled;
            }
        );
        this.configService.get('motions_min_supporters').subscribe(
            (supporters: number): void => {
                this.minSupporters = supporters;
            }
        );
        this.configService.get('motions_preamble').subscribe(
            (preamble: string): void => {
                this.preamble = preamble;
            }
        );
    }

    /**
     * Merges amendments and change recommendations and sorts them by the line numbers.
     * Called each time one of these arrays changes.
     */
    private recalcUnifiedChanges(): void {
        // @TODO implement amendments
        this.allChangingObjects = this.changeRecommendations;
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
        if (this.route.snapshot.url[0] && this.route.snapshot.url[0].path === 'new') {
            // creates a new motion
            this.newMotion = true;
            this.editMotion = true;
            this.motion = new ViewMotion();
            this.motionCopy = new ViewMotion();
        } else {
            // load existing motion
            this.route.params.subscribe(params => {
                this.repo.getViewModelObservable(params.id).subscribe(newViewMotion => {
                    if (newViewMotion) {
                        this.motion = newViewMotion;
                        this.patchForm(this.motion);
                    }
                });
                this.changeRecoRepo
                    .getChangeRecosOfMotionObservable(parseInt(params.id, 10))
                    .subscribe((recos: ViewChangeReco[]) => {
                        this.changeRecommendations = recos;
                        this.recalcUnifiedChanges();
                    });
            });
        }
    }

    /**
     * Async load the values of the motion in the Form.
     */
    public patchForm(formMotion: ViewMotion): void {
        const metaInfoPatch = {};
        Object.keys(this.metaInfoForm.controls).forEach(ctrl => {
            metaInfoPatch[ctrl] = formMotion[ctrl];
        });
        this.metaInfoForm.patchValue(metaInfoPatch);

        const contentPatch: { [key: string]: any } = {};
        Object.keys(this.contentForm.controls).forEach(ctrl => {
            contentPatch[ctrl] = formMotion[ctrl];
        });
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
        this.metaInfoForm = this.formBuilder.group({
            identifier: [''],
            category_id: [''],
            state_id: [''],
            recommendation_id: [''],
            submitters_id: [],
            supporters_id: [],
            workflow_id: [],
            origin: ['']
        });
        this.contentForm = this.formBuilder.group({
            title: ['', Validators.required],
            text: ['', Validators.required],
            reason: [''],
            statute_amendment: [''], // Internal value for the checkbox, not saved to the model
            statute_paragraph_id: ['']
        });
        this.updateWorkflowIdForCreateForm();
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
     * Save a motion. Calls the "patchValues" function in the MotionObject
     *
     * http:post the motion to the server.
     * The AutoUpdate-Service should see a change once it arrives and show it
     * in the list view automatically
     *
     */
    public async saveMotion(): Promise<void> {
        const newMotionValues = { ...this.metaInfoForm.value, ...this.contentForm.value };

        const fromForm = new Motion();
        fromForm.deserialize(newMotionValues);

        try {
            if (this.newMotion) {
                const response = await this.repo.create(fromForm);
                this.router.navigate(['./motions/' + response.id]);
            } else {
                await this.repo.update(fromForm, this.motionCopy);
                // if the motion was successfully updated, change the edit mode.
                this.editMotion = false;
            }
        } catch (e) {
            this.raiseError(e);
        }
    }

    /**
     * get the formated motion text from the repository.
     */
    public getFormattedTextPlain(): string {
        // Prevent this.allChangingObjects to be reordered from within formatMotion
        const changes: ViewUnifiedChange[] = Object.assign([], this.allChangingObjects);
        return this.repo.formatMotion(
            this.motion.id,
            this.motion.crMode,
            changes,
            this.motion.lineLength,
            this.motion.highlightedLine
        );
    }

    /**
     * get the formatted motion text from the repository, as SafeHTML for [innerHTML]
     * @returns {SafeHtml}
     */
    public getFormattedText(): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(this.getFormattedTextPlain());
    }

    /**
     * get the diff html from the statute amendment, as SafeHTML for [innerHTML]
     * @returns {SafeHtml}
     */
    public getFormattedStatuteAmendment(): SafeHtml {
        const diffHtml = this.repo.formatStatuteAmendment(this.statuteParagraphs, this.motion, this.motion.lineLength);
        return this.sanitizer.bypassSecurityTrustHtml(diffHtml);
    }

    /**
     * Trigger to delete the motion.
     * Sends a delete request over the repository and
     * shows a "are you sure" dialog
     */
    public async deleteMotionButton(): Promise<void> {
        this.repo.delete(this.motion).then(() => {
            this.router.navigate(['./motions/']);
        }, this.raiseError);
    }

    /**
     * Sets the motions line numbering mode
     * @param mode Needs to got the enum defined in ViewMotion
     */
    public setLineNumberingMode(mode: LineNumberingMode): void {
        this.motion.lnMode = mode;
    }

    /**
     * Returns true if no line numbers are to be shown.
     */
    public isLineNumberingNone(): boolean {
        return this.motion.lnMode === LineNumberingMode.None;
    }

    /**
     * Returns true if the line numbers are to be shown within the text with no line breaks.
     */
    public isLineNumberingInline(): boolean {
        return this.motion.lnMode === LineNumberingMode.Inside;
    }

    /**
     * Returns true if the line numbers are to be shown to the left of the text.
     */
    public isLineNumberingOutside(): boolean {
        return this.motion.lnMode === LineNumberingMode.Outside;
    }

    /**
     * Sets the motions change reco mode
     * @param mode Needs to fot to the enum defined in ViewMotion
     */
    public setChangeRecoMode(mode: number): void {
        this.motion.crMode = mode;
    }

    /**
     * Returns true if the original version (including change recommendation annotation) is to be shown
     */
    public isRecoModeOriginal(): boolean {
        return this.motion.crMode === ChangeRecoMode.Original;
    }

    /**
     * Returns true if the diff version is to be shown
     */
    public isRecoModeDiff(): boolean {
        return this.motion.crMode === ChangeRecoMode.Diff;
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
            changeRecommendation: this.repo.createChangeRecommendationTemplate(this.motion.id, lineRange)
        };
        this.dialogService.open(MotionChangeRecommendationComponent, {
            height: '400px',
            width: '600px',
            data: data
        });
    }

    /**
     * In the original version, a change-recommendation-annotation has been clicked
     * -> Go to the diff view and scroll to the change recommendation
     */
    public gotoChangeRecommendation(changeRecommendation: ViewChangeReco): void {
        this.scrollToChange = changeRecommendation;
        this.setChangeRecoMode(ChangeRecoMode.Diff);
    }

    /**
     * Comes from the head bar
     * @param mode
     */
    public setEditMode(mode: boolean): void {
        this.editMotion = mode;
        if (mode) {
            this.motionCopy = this.motion.copy();
            this.patchForm(this.motionCopy);
            if (this.vp.isMobile) {
                this.metaInfoPanel.open();
                this.contentPanel.open();
            }
        }
        if (!mode && this.newMotion) {
            this.router.navigate(['./motions/']);
        }
    }

    public updateWorkflowIdForCreateForm(): void {
        const isStatuteAmendment = !!this.contentForm.get('statute_amendment').value;
        const configKey = isStatuteAmendment ? 'motions_statute_amendments_workflow' : 'motions_workflow';
        // TODO: This should just be a takeWhile(id => !id), but should include the last one where the id is OK.
        // takeWhile will get a inclusive parameter, see https://github.com/ReactiveX/rxjs/pull/4115
        this.configService.get<string>(configKey).pipe(multicast(
            () => new ReplaySubject(1),
            (ids) => ids.pipe(takeWhile(id => !id), o => concat(o, ids.pipe(take(1))))
        ), skipWhile(id => !id)).subscribe(id => {
            this.metaInfoForm.patchValue({
                workflow_id: parseInt(id, 10),
            });
        });
    }

    /**
     * If the checkbox is deactivated, the statute_paragraph_id-field needs to be reset, as only that field is saved
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
     * @param motion target
     */
    public navigateToMotion(motion: ViewMotion): void {
        this.router.navigate(['../' + motion.id], { relativeTo: this.route });
        // update the current motion
        this.motion = motion;
        this.setSurroundingMotions();
    }

    /**
     * Sets the previous and next motion
     */
    public setSurroundingMotions(): void {
        const indexOfCurrent = this.allMotions.findIndex(motion => {
            return motion === this.motion;
        });
        if (indexOfCurrent > -1) {
            if (indexOfCurrent > 0) {
                this.previousMotion = this.allMotions[indexOfCurrent - 1];
            } else {
                this.previousMotion = null;
            }

            if (indexOfCurrent < this.allMotions.length - 1) {
                this.nextMotion = this.allMotions[indexOfCurrent + 1];
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
     * @param id Motion state id
     */
    public setState(id: number): void {
        this.repo.setState(this.motion, id);
    }

    /**
     * Sets the recommendation
     * @param id Motion recommendation id
     */
    public setRecommendation(id: number): void {
        this.repo.setRecommendation(this.motion, id);
    }

    /**
     * Sets the category for current motion
     * @param id Motion category id
     */
    public setCategory(id: number): void {
        this.repo.setCatetory(this.motion, id);
    }

    /**
     * Observes the repository for changes in the motion recommender
     */
    public setupRecommender(): void {
        const configKey = this.motion.isStatuteAmendment() ? 'motions_statute_recommendations_by' : 'motions_recommendations_by';
        if (this.recommenderSubscription) {
            this.recommenderSubscription.unsubscribe();
        }
        this.recommenderSubscription = this.configService.get(configKey).subscribe(recommender => {
            this.recommender = recommender;
        });
    }

    /**
     * Create the absolute path to the corresponding list of speakers
     * @returns the link to the corresponding list of speakers as string
     */
    public getSpeakerLink(): string {
        return `/agenda/${this.motion.agenda_item_id}/speakers`;
    }

    /**
     * Determine if the user has the correct requirements to alter the motion
     */
    public opCanEdit(): boolean {
        return this.op.hasPerms('motions.can_manage', 'motions.can_manage_metadata');
    }

    /**
     * Init.
     * Sets the surrounding motions to navigate back and forth
     */
    public ngOnInit(): void {
        this.repo.getViewModelListObservable().subscribe(newMotionList => {
            if (newMotionList) {
                this.allMotions = newMotionList;
                this.setSurroundingMotions();
            }
        });
        this.statuteRepo.getViewModelListObservable().subscribe(newViewStatuteParagraphs => {
            this.statuteParagraphs = newViewStatuteParagraphs;
        });
    }
}
