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
    editMotion = false;

    // categoryFormControl: FormControl;

    constructor(private route: ActivatedRoute, private formBuilder: FormBuilder) {
        super();
        this.createForm();
        this.route.params.subscribe(params => {
            // has the motion of the DataStore was initialized before.
            this.motion = this.DS.get(Motion, params.id) as Motion;
            if (this.motion) {
                this.patchForm();
            }

            // Observe motion to get the motion in the parameter and also get the changes
            this.DS.getObservable().subscribe(newModel => {
                if (newModel instanceof Motion) {
                    if (newModel.id === +params.id) {
                        this.motion = newModel as Motion;
                        this.patchForm();
                    }
                }
            });
        });
    }

    /** Parches the Form with content from the dataStore */
    patchForm() {
        this.metaInfoForm.patchValue({ categoryFormControl: this.motion.category });
        this.metaInfoForm.patchValue({ state: this.motion.state });
    }

    /** Create the whole Form with empty or default values */
    createForm() {
        this.metaInfoForm = this.formBuilder.group({
            categoryFormControl: [''],
            state: ['']
        });
    }

    saveMotion() {
        console.log('Save motion: ', this.metaInfoForm.value);
    }

    getMotionCategories(): Category[] {
        const categories = this.DS.get(Category);
        return categories as Category[];
    }

    editMotionButton() {
        this.editMotion ? (this.editMotion = false) : (this.editMotion = true);
        if (this.editMotion) {
            this.metaInfoPanel.open();
            this.contentPanel.open();
        }

        // console.log('this.motion.possible_states: ', this.motion.possible_states);
    }

    ngOnInit() {
        console.log('(init)the motion: ', this.motion);
        console.log('motion state name: ', this.motion.state);
    }

    downloadSingleMotionButton() {
        console.log('Download this motion');
    }
}
