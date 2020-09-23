import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

import { OperatorService, Permission } from 'app/core/core-services/operator.service';
import { ItemRepositoryService } from 'app/core/repositories/agenda/item-repository.service';
import { TopicRepositoryService } from 'app/core/repositories/topics/topic-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ItemVisibilityChoices } from 'app/shared/models/agenda/item';
import { Topic } from 'app/shared/models/topics/topic';
import { ViewItem } from 'app/site/agenda/models/view-item';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { CreateTopic } from '../../models/create-topic';
import { ViewTopic } from '../../models/view-topic';

/**
 * Detail page for topics.
 */
@Component({
    selector: 'os-topic-detail',
    templateUrl: './topic-detail.component.html',
    styleUrls: ['./topic-detail.component.scss']
})
export class TopicDetailComponent extends BaseViewComponentDirective {
    /**
     * Determine if the topic is in edit mode
     */
    public editTopic: boolean;

    /**
     * Determine is created
     */
    public newTopic: boolean;

    /**
     * Holds the current view topic
     */
    public topic: ViewTopic;

    /**
     * Topic form
     */
    public topicForm: FormGroup;

    /**
     * Subject for agenda items
     */
    public itemObserver: BehaviorSubject<ViewItem[]>;

    /**
     * Determine visibility states for the agenda that will be created implicitly
     */
    public itemVisibility = ItemVisibilityChoices;

    /**
     * Constructor for the topic detail page.
     *
     * @param title Setting the browsers title
     * @param matSnackBar display errors and other messages
     * @param translate Handles translations
     * @param route Angulars ActivatedRoute
     * @param router Angulars Router
     * @param formBuilder Angulars FormBuilder
     * @param repo The topic repository
     * @param promptService Allows warning before deletion attempts
     * @param operator The current user
     * @param DS Data Store
     */
    public constructor(
        title: Title,
        matSnackBar: MatSnackBar,
        protected translate: TranslateService,
        private route: ActivatedRoute,
        private router: Router,
        private formBuilder: FormBuilder,
        private repo: TopicRepositoryService,
        private promptService: PromptService,
        private operator: OperatorService,
        private itemRepo: ItemRepositoryService
    ) {
        super(title, translate, matSnackBar);
        this.getTopicByUrl();
        this.createForm();

        this.itemObserver = this.itemRepo.getViewModelListBehaviorSubject();
    }

    /**
     * Set the edit mode to the given Status
     *
     * @param mode
     */
    public setEditMode(mode: boolean): void {
        this.editTopic = mode;
        if (mode) {
            this.patchForm();
        }
        if (!mode && this.newTopic) {
            this.router.navigate(['./agenda/']);
        }
    }

    /**
     * Save a new topic as agenda item
     */
    public async saveTopic(): Promise<void> {
        if (!this.topicForm.valid) {
            return;
        }

        try {
            if (this.newTopic) {
                if (!this.topicForm.value.agenda_parent_id) {
                    delete this.topicForm.value.agenda_parent_id;
                }
                await this.repo.create(new CreateTopic(this.topicForm.value));
                this.router.navigate([`/agenda/`]);
            } else {
                await this.repo.update(this.topicForm.value, this.topic);
                this.setEditMode(false);
            }
        } catch (e) {
            this.raiseError(e);
        }
    }

    /**
     * Setup the form to create or alter the topic
     */
    public createForm(): void {
        this.topicForm = this.formBuilder.group({
            agenda_type: [],
            agenda_parent_id: [],
            attachments_id: [[]],
            text: [''],
            title: ['', Validators.required]
        });

        this.topicForm.get('agenda_type').setValue(1);
    }

    /**
     * Overwrite form Values with values from the topic
     */
    public patchForm(): void {
        const topicPatch = {};
        Object.keys(this.topicForm.controls).forEach(ctrl => {
            topicPatch[ctrl] = this.topic[ctrl];
        });

        this.topicForm.patchValue(topicPatch);
    }

    /**
     * Determine whether a new topic should be created or an existing one should
     * be loaded using the ID from the URL
     */
    public getTopicByUrl(): void {
        if (this.route.snapshot.url[0] && this.route.snapshot.url[0].path === 'new') {
            // creates a new topic
            this.newTopic = true;
            this.editTopic = true;
            this.topic = new ViewTopic(new Topic());
            super.setTitle('New topic');
        } else {
            // load existing topic
            this.route.params.subscribe(params => {
                this.loadTopic(params.id);
            });
        }
    }

    /**
     * Loads a top from the repository
     *
     * @param id the id of the required topic
     */
    public loadTopic(id: number): void {
        this.repo.getViewModelObservable(id).subscribe(newViewTopic => {
            // repo sometimes delivers undefined values
            // also ensures edition cannot be interrupted by autoupdate
            if (newViewTopic && !this.editTopic) {
                const title = newViewTopic.getTitle();
                super.setTitle(title);
                this.topic = newViewTopic;
                // personalInfoForm is undefined during 'new' and directly after reloading
                if (this.topicForm && !this.editTopic) {
                    this.patchForm();
                }
            }
        });
    }

    /**
     * Handler for the delete button. Uses the PromptService
     */
    public async onDeleteButton(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this entry?');
        const content = this.topic.title;
        if (await this.promptService.open(title, content)) {
            await this.repo.delete(this.topic).catch(this.raiseError);
            this.router.navigate(['/agenda']);
        }
    }

    /**
     * Checks if the operator is allowed to perform one of the given actions
     *
     * @param action the desired action
     * @returns true if the operator has the correct permissions, false of not
     */
    public isAllowed(action: string): boolean {
        switch (action) {
            case 'see':
                return this.operator.hasPerms(Permission.agendaCanSee);
            case 'edit':
                return this.operator.hasPerms(Permission.agendaCanManage);
            case 'default':
                return false;
        }
    }

    /**
     * clicking Shift and Enter will save automatically
     * Hitting escape while in topicForm should cancel editing
     *
     * @param event has the code
     */
    public onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && event.shiftKey) {
            this.saveTopic();
        }

        if (event.key === 'Escape') {
            this.setEditMode(false);
        }
    }
}
