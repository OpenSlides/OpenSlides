import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseComponent } from '../../../base.component';
import { Motion } from '../../../shared/models/motions/motion';
import { Category } from '../../../shared/models/motions/category';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatExpansionPanel } from '@angular/material';

@Component({
    selector: 'app-motion-detail',
    templateUrl: './motion-detail.component.html',
    styleUrls: ['./motion-detail.component.scss']
})
export class MotionDetailComponent extends BaseComponent implements OnInit {
    @ViewChild('metaInfoPanel') metaInfoPanel: MatExpansionPanel;
    @ViewChild('contentPanel') contentPanel: MatExpansionPanel;

    motion: Motion;
    metaInfoForm: FormGroup;
    contentForm: FormGroup;
    editMotion = false;
    newMotion = false;

    /**
     *
     * @param route determine if this is a new or an existing motion
     * @param formBuilder For reactive forms. Form Group and Form Control
     */
    constructor(private route: ActivatedRoute, private formBuilder: FormBuilder) {
        super();
        this.createForm();

        console.log('route: ', route.snapshot.url[0].path);

        if (route.snapshot.url[0].path === 'new') {
            this.newMotion = true;
            this.editMotion = true;
            this.motion = new Motion();
        } else {
            // load existing motion
            this.route.params.subscribe(params => {
                console.log('params ', params);

                // has the motion of the DataStore was initialized before.
                this.motion = this.DS.get(Motion, params.id) as Motion;

                // Observe motion to get the motion in the parameter and also get the changes
                this.DS.getObservable().subscribe(newModel => {
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
    patchForm() {
        this.metaInfoForm.patchValue({
            category_id: this.motion.category.id,
            state_id: this.motion.state.id,
            recommendation_id: this.motion.recommendation.id,
            identifier: this.motion.identifier,
            origin: this.motion.origin
        });
        this.contentForm.patchValue({
            currentTitle: this.motion.currentTitle,
            currentText: this.motion.currentText,
            currentReason: this.motion.currentReason
        });
    }

    /**
     * Creates the forms for the Motion and the MotionVersion
     *
     * TODO: Build a custom form validator
     */
    createForm() {
        this.metaInfoForm = this.formBuilder.group({
            identifier: [''],
            category_id: [''],
            state_id: [''],
            recommendation_id: [''],
            origin: ['']
        });
        this.contentForm = this.formBuilder.group({
            currentTitle: [''],
            currentText: [''],
            currentReason: ['']
        });
    }

    /**
     * Save a motion. Calls the "patchValues" function in the MotionObject
     *
     * http:post the motion to the server.
     * The AutoUpdate-Service should see a change once it arrives and show it
     * in the list view automatically
     */
    saveMotion() {
        const newMotionValues = { ...this.metaInfoForm.value, ...this.contentForm.value };
        this.motion.patchValues(newMotionValues);

        console.log('save motion: this: ', this);

        this.DS.save(this.motion).subscribe(answer => {
            console.log(answer);
        });
    }

    /**
     * return all Categories.
     */
    getMotionCategories(): Category[] {
        const categories = this.DS.get(Category);
        return categories as Category[];
    }

    /**
     * Click on the edit button (pen-symbol)
     */
    editMotionButton() {
        this.editMotion ? (this.editMotion = false) : (this.editMotion = true);

        if (this.editMotion) {
            this.patchForm();
            this.metaInfoPanel.open();
            this.contentPanel.open();
        } else {
            this.saveMotion();
        }
    }

    /**
     * Init. Does nothing here.
     */
    ngOnInit() {}

    /**
     * Function to download a motion.
     *
     * TODO: does nothing yet.
     */
    downloadSingleMotionButton() {
        console.log('Download this motion');
    }
}
