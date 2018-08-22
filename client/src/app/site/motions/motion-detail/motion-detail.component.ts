import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponent } from '../../../base.component';
import { Motion } from '../../../shared/models/motions/motion';
import { Category } from '../../../shared/models/motions/category';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatExpansionPanel } from '@angular/material';
import { DataStoreService } from '../../../core/services/dataStore.service';
import { OperatorService } from '../../../core/services/operator.service';

/**
 * Component for the motion detail view
 */
@Component({
    selector: 'app-motion-detail',
    templateUrl: './motion-detail.component.html',
    styleUrls: ['./motion-detail.component.scss']
})
// export class MotionDetailComponent extends BaseComponent implements OnInit {
export class MotionDetailComponent implements OnInit {
    /**
     * MatExpansionPanel for the meta info
     */
    @ViewChild('metaInfoPanel') metaInfoPanel: MatExpansionPanel;

    /**
     * MatExpansionPanel for the content panel
     */
    @ViewChild('contentPanel') contentPanel: MatExpansionPanel;

    /**
     * Target motion. Might be new or old
     */
    motion: Motion;

    /**
     * Motions meta-info
     */
    metaInfoForm: FormGroup;

    /**
     * Motion content. Can be a new version
     */
    contentForm: FormGroup;

    /**
     * Determine if the motion is edited
     */
    editMotion = false;

    /**
     * Determine if the motion is new
     */
    newMotion = false;

    /**
     * Constuct the detail view.
     *
     * TODO: DataStore needs removed and added via the parent.
     *       Own service for put and post required
     *
     * @param route determine if this is a new or an existing motion
     * @param formBuilder For reactive forms. Form Group and Form Control
     */
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private formBuilder: FormBuilder,
        private operator: OperatorService,
        private myDataStore: DataStoreService
    ) {
        // TODO: Add super again
        // super();
        this.createForm();

        if (route.snapshot.url[0].path === 'new') {
            this.newMotion = true;
            this.editMotion = true;
            this.motion = new Motion();
        } else {
            // load existing motion
            this.route.params.subscribe(params => {
                console.log('params ', params);

                // has the motion of the DataStore was initialized before.
                this.motion = this.myDataStore.get(Motion, params.id) as Motion;

                // Observe motion to get the motion in the parameter and also get the changes
                this.myDataStore.getObservable().subscribe(newModel => {
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

        // TODO: This is DRAFT. Reads out Motion version directly. Potentially insecure.
        this.motion.title = this.motion.currentTitle;
        this.motion.text = this.motion.currentText;

        this.myDataStore.save(this.motion).subscribe(answer => {
            console.log('answer, ', answer);
            if (answer && answer.id && this.newMotion) {
                this.router.navigate(['./motions/' + answer.id]);
            }
        });
    }

    /**
     * return all Categories.
     */
    getMotionCategories(): Category[] {
        const categories = this.myDataStore.get(Category);
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
