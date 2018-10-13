import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatExpansionPanel } from '@angular/material';

import { BaseComponent } from '../../../../base.component';
import { Category } from '../../../../shared/models/motions/category';
import { ViewportService } from '../../../../core/services/viewport.service';
import { MotionRepositoryService } from '../../services/motion-repository.service';
import { ViewMotion } from '../../models/view-motion';
import { User } from '../../../../shared/models/users/user';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { TranslateService } from '@ngx-translate/core';
import { Motion } from '../../../../shared/models/motions/motion';
import { BehaviorSubject } from 'rxjs';

/**
 * Component for the motion detail view
 */
@Component({
    selector: 'os-motion-detail',
    templateUrl: './motion-detail.component.html',
    styleUrls: ['./motion-detail.component.scss']
})
export class MotionDetailComponent extends BaseComponent implements OnInit {
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
     * Target motion. Might be new or old
     */
    public motion: ViewMotion;

    /**
     * Copy of the motion that the user might edit
     */
    public motionCopy: ViewMotion;

    /**
     * Subject for the Categories
     */
    public categoryObserver: BehaviorSubject<Array<Category>>;

    /**
     * Subject for the Submitters
     */
    public submitterObserver: BehaviorSubject<Array<User>>;

    /**
     * Subject for the Supporters
     */
    public supporterObserver: BehaviorSubject<Array<User>>;

    /**
     * Constuct the detail view.
     *
     * @param vp the viewport service
     * @param router to navigate back to the motion list and to an existing motion
     * @param route determine if this is a new or an existing motion
     * @param formBuilder For reactive forms. Form Group and Form Control
     * @param repo: Motion Repository
     * @param translate: Translation Service
     */
    public constructor(
        public vp: ViewportService,
        private router: Router,
        private route: ActivatedRoute,
        private formBuilder: FormBuilder,
        private repo: MotionRepositoryService,
        private DS: DataStoreService,
        protected translate: TranslateService
    ) {
        super();
        this.createForm();

        if (route.snapshot.url[0] && route.snapshot.url[0].path === 'new') {
            this.newMotion = true;
            this.editMotion = true;

            // Both are (temporarily) necessary until submitter and supporters are implemented
            // TODO new Motion and ViewMotion
            this.motion = new ViewMotion();
            this.motionCopy = new ViewMotion();
        } else {
            // load existing motion
            this.route.params.subscribe(params => {
                this.repo.getViewModelObservable(params.id).subscribe(newViewMotion => {
                    this.motion = newViewMotion;
                });
            });
        }
        // Initial Filling of the Subjects
        this.submitterObserver = new BehaviorSubject(DS.getAll(User));
        this.supporterObserver = new BehaviorSubject(DS.getAll(User));
        this.categoryObserver = new BehaviorSubject(DS.getAll(Category));

        // Make sure the subjects are updated, when a new Model for the type arrives
        this.DS.changeObservable.subscribe(newModel => {
            if (newModel instanceof User) {
                this.submitterObserver.next(DS.getAll(User));
                this.supporterObserver.next(DS.getAll(User));
            }
            if (newModel instanceof Category) {
                this.categoryObserver.next(DS.getAll(Category));
            }
        });
    }

    /**
     * Async load the values of the motion in the Form.
     */
    public patchForm(formMotion: ViewMotion): void {
        this.metaInfoForm.patchValue({
            category_id: formMotion.categoryId,
            supporters_id: formMotion.supporterIds,
            submitters_id: formMotion.submitterIds,
            state_id: formMotion.stateId,
            recommendation_id: formMotion.recommendationId,
            identifier: formMotion.identifier,
            origin: formMotion.origin
        });
        this.contentForm.patchValue({
            title: formMotion.title,
            text: formMotion.text,
            reason: formMotion.reason
        });
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
            origin: ['']
        });
        this.contentForm = this.formBuilder.group({
            title: ['', Validators.required],
            text: ['', Validators.required],
            reason: ['']
        });
    }

    /**
     * Save a motion. Calls the "patchValues" function in the MotionObject
     *
     * http:post the motion to the server.
     * The AutoUpdate-Service should see a change once it arrives and show it
     * in the list view automatically
     *
     * TODO: state is not yet saved. Need a special "put" command
     *
     * TODO: Repo should handle
     */
    public saveMotion(): void {
        const newMotionValues = { ...this.metaInfoForm.value, ...this.contentForm.value };
        const fromForm = new Motion();
        fromForm.deserialize(newMotionValues);

        if (this.newMotion) {
            this.repo.create(fromForm).subscribe(response => {
                if (response.id) {
                    this.router.navigate(['./motions/' + response.id]);
                }
            });
        } else {
            this.repo.update(fromForm, this.motionCopy).subscribe(response => {
                // if the motion was successfully updated, change the edit mode.
                // TODO: Show errors if there appear here
                if (response.id) {
                    this.editMotion = false;
                }
            });
        }
    }

    /**
     * get the formated motion text from the repository.
     */
    public getFormatedText(): string {
        return this.repo.formatMotion(this.motion.id, this.motion.lnMode, this.motion.crMode);
    }

    /**
     * Click on the edit button (pen-symbol)
     */
    public editMotionButton(): void {
        if (this.editMotion) {
            this.saveMotion();
        } else {
            this.editMotion = true;
            this.motionCopy = this.motion.copy();
            this.patchForm(this.motionCopy);
            if (this.vp.isMobile) {
                this.metaInfoPanel.open();
                this.contentPanel.open();
            }
        }
    }

    /**
     * Cancel the editing process
     *
     * If a new motion was created, return to the list.
     */
    public cancelEditMotionButton(): void {
        if (this.newMotion) {
            this.router.navigate(['./motions/']);
        } else {
            this.editMotion = false;
        }
    }

    /**
     * Trigger to delete the motion
     *
     * TODO: Repo should handle
     */
    public deleteMotionButton(): void {
        this.repo.delete(this.motion).subscribe(answer => {
            this.router.navigate(['./motions/']);
        });
    }

    /**
     * Sets the motions line numbering mode
     * @param mode Needs to fot to the enum defined in ViewMotion
     */
    public setLineNumberingMode(mode: number): void {
        this.motion.lnMode = mode;
    }

    /**
     * Sets the motions change reco mode
     * @param mode Needs to fot to the enum defined in ViewMotion
     */
    public setChangeRecoMode(mode: number): void {
        this.motion.crMode = mode;
    }

    /**
     * Init. Does nothing here.
     */
    public ngOnInit(): void {}
}
