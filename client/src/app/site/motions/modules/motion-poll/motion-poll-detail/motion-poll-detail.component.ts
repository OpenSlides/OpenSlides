import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { MotionPollRepositoryService } from 'app/core/repositories/motions/motion-poll-repository.service';
import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { MotionPoll, MotionPollMethodsVerbose } from 'app/shared/models/motions/motion-poll';
import {
    MajorityMethodVerbose,
    PercentBaseVerbose,
    PollStateVerbose,
    PollTypeVerbose
} from 'app/shared/models/poll/base-poll';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';
import { ViewGroup } from 'app/site/users/models/view-group';

@Component({
    selector: 'os-motion-poll-detail',
    templateUrl: './motion-poll-detail.component.html',
    styleUrls: ['./motion-poll-detail.component.scss']
})
export class MotionPollDetailComponent extends BaseViewComponent implements OnInit {
    private pollId: number;

    public pollStates = PollStateVerbose;
    public pollMethods = MotionPollMethodsVerbose;
    public pollTypes = PollTypeVerbose;
    public percentBases = PercentBaseVerbose;
    public majorityMethods = MajorityMethodVerbose;

    public userGroups: ViewGroup[] = [];

    public groupObservable: Observable<ViewGroup[]> = null;

    public isNewPoll = false;

    public poll: ViewMotionPoll = null;

    public motionId: number;

    public isEditingPoll = false;

    public contentForm: FormGroup;

    public constructor(
        title: Title,
        protected translate: TranslateService,
        matSnackbar: MatSnackBar,
        private repo: MotionPollRepositoryService,
        private route: ActivatedRoute,
        private router: Router,
        private fb: FormBuilder,
        private groupRepo: GroupRepositoryService,
        private location: Location
    ) {
        super(title, translate, matSnackbar);
    }

    public ngOnInit(): void {
        this.findComponentById();
        this.createPoll();

        this.groupObservable = this.groupRepo.getViewModelListObservable();
        this.subscriptions.push(
            this.groupRepo.getViewModelListObservable().subscribe(groups => (this.userGroups = groups))
        );
    }

    public savePoll(): void {
        const pollValues = this.contentForm.value;
        const poll: MotionPoll = this.isNewPoll ? new MotionPoll() : this.poll.poll;
        Object.keys(pollValues).forEach(key => (poll[key] = pollValues[key]));
        if (this.isNewPoll) {
            poll.motion_id = this.motionId;
            this.repo.create(poll).then(success => {
                if (success && success.id) {
                    this.pollId = success.id;
                    this.router.navigate(['motions', 'polls', this.pollId]);
                }
            }, this.raiseError);
        } else {
            this.repo.update(pollValues, this.poll).then(() => (this.isEditingPoll = false), this.raiseError);
        }
    }

    public editPoll(): void {
        this.isEditingPoll = true;
    }

    public backToView(): void {
        if (this.pollId) {
            this.isEditingPoll = false;
        } else {
            // TODO
            this.location.back();
        }
    }

    private findComponentById(): void {
        const params = this.route.snapshot.params;
        const queryParams = this.route.snapshot.queryParams;
        if (params && params.id) {
            this.pollId = +params.id;
            this.subscriptions.push(
                this.repo.getViewModelObservable(this.pollId).subscribe(poll => {
                    if (poll) {
                        this.poll = poll;
                        this.updateForm();
                    }
                })
            );
        } else {
            this.isNewPoll = true;
            this.isEditingPoll = true;
            if (queryParams && queryParams.parent) {
                this.motionId = +queryParams.parent;
            }
        }
        if (queryParams && queryParams.edit) {
            this.isEditingPoll = true;
        }
    }

    private createPoll(): void {
        this.contentForm = this.fb.group({
            title: ['', Validators.required],
            type: ['', Validators.required],
            pollmethod: ['', Validators.required],
            onehundred_percent_base: ['', Validators.required],
            majority_method: ['', Validators.required],
            groups_id: [[]]
        });
        if (this.poll) {
            this.updateForm();
        }
    }

    private updateForm(): void {
        if (this.contentForm) {
            Object.keys(this.contentForm.controls).forEach(key => {
                this.contentForm.get(key).setValue(this.poll[key]);
            });
        }
    }
}
