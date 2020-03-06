import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { AssignmentPollRepositoryService } from 'app/core/repositories/assignments/assignment-poll-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ChartType } from 'app/shared/components/charts/charts.component';
import { BasePollComponent } from 'app/site/polls/components/base-poll.component';
import { PollService } from 'app/site/polls/services/poll.service';
import { AssignmentPollDialogService } from '../../services/assignment-poll-dialog.service';
import { AssignmentPollPdfService } from '../../services/assignment-poll-pdf.service';
import { ViewAssignmentPoll } from '../../models/view-assignment-poll';

/**
 * Component for a single assignment poll. Used in assignment detail view
 */
@Component({
    selector: 'os-assignment-poll',
    templateUrl: './assignment-poll.component.html',
    styleUrls: ['./assignment-poll.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AssignmentPollComponent extends BasePollComponent<ViewAssignmentPoll> implements OnInit {
    @Input()
    public set poll(value: ViewAssignmentPoll) {
        this.initPoll(value);
        this.candidatesLabels = this.pollService.getChartLabels(value);
        const chartData = this.pollService.generateChartData(value);
        this.chartDataSubject.next(chartData);
    }

    public get poll(): ViewAssignmentPoll {
        return this._poll;
    }

    public get chartType(): ChartType {
        return 'stackedBar';
    }

    public candidatesLabels: string[] = [];

    /**
     * Form for updating the poll's description
     */
    public descriptionForm: FormGroup;

    /**
     * @returns true if the description on the form differs from the poll's description
     */
    public get dirtyDescription(): boolean {
        return this.descriptionForm.get('description').value !== this.poll.description;
    }

    public constructor(
        titleService: Title,
        matSnackBar: MatSnackBar,
        translate: TranslateService,
        dialog: MatDialog,
        promptService: PromptService,
        repo: AssignmentPollRepositoryService,
        pollDialog: AssignmentPollDialogService,
        public pollService: PollService,
        private formBuilder: FormBuilder,
        private pdfService: AssignmentPollPdfService
    ) {
        super(titleService, matSnackBar, translate, dialog, promptService, repo, pollDialog);
    }

    public ngOnInit(): void {
        this.descriptionForm = this.formBuilder.group({
            description: this.poll ? this.poll.description : ''
        });
    }

    /**
     * Print the PDF of this poll with the corresponding options and numbers
     */
    public printBallot(): void {
        this.pdfService.printBallots(this.poll);
    }
}
