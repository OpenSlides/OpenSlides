import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatExpansionPanel } from '@angular/material';

import { BaseComponent } from '../../../../base.component';
import { Category } from '../../../../shared/models/motions/category';
import { ViewportService } from '../../../../core/services/viewport.service';
import { MotionRepositoryService } from '../../services/motion-repository.service';
import { ViewMotion } from '../../models/view-motion';

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
    @ViewChild('metaInfoPanel') public metaInfoPanel: MatExpansionPanel;

    /**
     * MatExpansionPanel for the content panel
     * Only relevant in mobile view
     */
    @ViewChild('contentPanel') public contentPanel: MatExpansionPanel;

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
     * Constuct the detail view.
     *
     * @param vp the viewport service
     * @param router to navigate back to the motion list and to an existing motion
     * @param route determine if this is a new or an existing motion
     * @param formBuilder For reactive forms. Form Group and Form Control
     * @param repo: Motion Repository
     */
    public constructor(
        public vp: ViewportService,
        private router: Router,
        private route: ActivatedRoute,
        private formBuilder: FormBuilder,
        private repo: MotionRepositoryService
    ) {
        super();
        this.createForm();

        if (route.snapshot.url[0].path === 'new') {
            this.newMotion = true;
            this.editMotion = true;

            // Both are (temporarily) necessary until submitter and supporters are implemented
            // TODO new Motion and ViewMotion
            this.motion = new ViewMotion();
            this.motionCopy = new ViewMotion();
        } else {
            // load existing motion
            this.route.params.subscribe(params => {
                this.repo.getViewMotionObservable(params.id).subscribe(newViewMotion => {
                    this.motion = newViewMotion;
                });
            });
        }
    }

    /**
     * Async load the values of the motion in the Form.
     */
    public patchForm(formMotion: ViewMotion): void {
        this.metaInfoForm.patchValue({
            category_id: formMotion.categoryId,
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
        if (this.newMotion) {
            this.repo.saveMotion(newMotionValues).subscribe(response => {
                this.router.navigate(['./motions/' + response.id]);
            });
        } else {
            this.repo.saveMotion(newMotionValues, this.motionCopy).subscribe();
        }
    }

    /**
     * return all Categories
     */
    public getMotionCategories(): Category[] {
        return this.DS.getAll(Category);
    }

    /**
     * Click on the edit button (pen-symbol)
     */
    public editMotionButton(): void {
        this.editMotion ? (this.editMotion = false) : (this.editMotion = true);
        if (this.editMotion) {
            // copy the motion
            this.motionCopy = this.motion.copy();
            this.patchForm(this.motionCopy);
            if (this.vp.isMobile) {
                this.metaInfoPanel.open();
                this.contentPanel.open();
            }
        } else {
            this.saveMotion();
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
        this.repo.deleteMotion(this.motion).subscribe(answer => {
            this.router.navigate(['./motions/']);
        });
    }

    /**
     * Init. Does nothing here.
     */
    public ngOnInit(): void {}
}
