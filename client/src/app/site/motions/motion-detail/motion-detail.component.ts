import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatExpansionPanel } from '@angular/material';

import { BaseComponent } from '../../../base.component';
import { Motion } from '../../../shared/models/motions/motion';
import { Category } from '../../../shared/models/motions/category';
import { DataSendService } from '../../../core/services/data-send.service';
import { ViewportService } from '../../../core/services/viewport.service';

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
     */
    @ViewChild('metaInfoPanel') public metaInfoPanel: MatExpansionPanel;

    /**
     * MatExpansionPanel for the content panel
     */
    @ViewChild('contentPanel') public contentPanel: MatExpansionPanel;

    /**
     * Target motion. Might be new or old
     */
    public motion: Motion;

    /**
     * Copy of the motion that the user might edit
     */
    public motionCopy: Motion;

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
     * Constuct the detail view.
     *
     * @param vp the viewport service
     * @param router to navigate back to the motion list and to an existing motion
     * @param route determine if this is a new or an existing motion
     * @param formBuilder For reactive forms. Form Group and Form Control
     * @param dataSend To send changes of the motion
     */
    public constructor(
        public vp: ViewportService,
        private router: Router,
        private route: ActivatedRoute,
        private formBuilder: FormBuilder,
        private dataSend: DataSendService
    ) {
        super();
        this.createForm();

        if (route.snapshot.url[0].path === 'new') {
            this.newMotion = true;
            this.editMotion = true;

            // Both are (temporarily) necessary until submitter and supporters are implemented
            this.motion = new Motion();
            this.motionCopy = new Motion();
        } else {
            // load existing motion
            this.route.params.subscribe(params => {
                // has the motion of the DataStore was initialized before.
                this.motion = this.DS.get(Motion, params.id) as Motion;

                // Observe motion to get the motion in the parameter and also get the changes
                this.DS.changeObservable.subscribe(newModel => {
                    if (newModel instanceof Motion) {
                        if (newModel.id === +params.id) {
                            this.motion = newModel as Motion;
                        }
                    }
                });
            });
        }
    }

    /**
     * Async load the values of the motion in the Form.
     */
    public patchForm(formMotion: Motion) {
        this.metaInfoForm.patchValue({
            category_id: formMotion.category_id,
            state_id: formMotion.state_id,
            recommendation_id: formMotion.recommendation_id,
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
    public createForm() {
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
     */
    public saveMotion() {
        const newMotionValues = { ...this.metaInfoForm.value, ...this.contentForm.value };
        this.motionCopy.patchValues(newMotionValues);

        // TODO: send to normal motion to verify
        this.dataSend.saveModel(this.motionCopy).subscribe(answer => {
            if (answer && answer.id && this.newMotion) {
                this.router.navigate(['./motions/' + answer.id]);
            }
        });
    }

    /**
     * return all Categories.
     */
    public getMotionCategories(): Category[] {
        return this.DS.getAll<Category>(Category);
    }

    /**
     * Click on the edit button (pen-symbol)
     */
    public editMotionButton() {
        this.editMotion ? (this.editMotion = false) : (this.editMotion = true);
        if (this.editMotion) {
            // copy the motion
            this.motionCopy = new Motion();
            this.motionCopy.patchValues(this.motion);
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
     * Trigger to delete the motion
     */
    public deleteMotionButton() {
        this.dataSend.delete(this.motion).subscribe(answer => {
            this.router.navigate(['./motions/']);
        });
    }

    /**
     * Init. Does nothing here.
     */
    public ngOnInit() {}
}
