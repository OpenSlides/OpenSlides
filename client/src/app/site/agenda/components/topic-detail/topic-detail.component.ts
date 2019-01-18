import { Component } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';

import { BaseViewComponent } from 'app/site/base/base-view';
import { PromptService } from 'app/core/services/prompt.service';
import { TopicRepositoryService } from '../../services/topic-repository.service';
import { ViewTopic } from '../../models/view-topic';
import { OperatorService } from 'app/core/services/operator.service';
import { BehaviorSubject } from 'rxjs';
import { DataStoreService } from 'app/core/services/data-store.service';
import { Mediafile } from 'app/shared/models/mediafiles/mediafile';
import { Item, itemVisibilityChoices } from 'app/shared/models/agenda/item';
import { CreateTopic } from '../../models/create-topic';

/**
 * Detail page for topics.
 */
@Component({
    selector: 'os-topic-detail',
    templateUrl: './topic-detail.component.html',
    styleUrls: ['./topic-detail.component.scss']
})
export class TopicDetailComponent extends BaseViewComponent {
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
     * Subject for mediafiles
     */
    public mediafilesObserver: BehaviorSubject<Mediafile[]>;

    /**
     * Subject for agenda items
     */
    public agendaItemObserver: BehaviorSubject<Item[]>;

    /**
     * Determine visibility states for the agenda that will be created implicitly
     */
    public itemVisibility = itemVisibilityChoices;

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
        private DS: DataStoreService
    ) {
        super(title, translate, matSnackBar);
        this.getTopicByUrl();
        this.createForm();

        this.mediafilesObserver = new BehaviorSubject(this.DS.getAll(Mediafile));
        this.agendaItemObserver = new BehaviorSubject(this.DS.getAll(Item));

        this.DS.changeObservable.subscribe(newModel => {
            if (newModel instanceof Item) {
                this.agendaItemObserver.next(DS.getAll(Item));
            } else if (newModel instanceof Mediafile) {
                this.mediafilesObserver.next(DS.getAll(Mediafile));
            }
        });
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
        if (this.newTopic && this.topicForm.valid) {
            if (!this.topicForm.value.agenda_parent_id) {
                delete this.topicForm.value.agenda_parent_id;
            }
            await this.repo.create(new CreateTopic(this.topicForm.value));
            this.router.navigate([`/agenda/`]);
        } else {
            this.setEditMode(false);
            await this.repo.update(this.topicForm.value, this.topic);
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
        if (this.route.snapshot.url[1] && this.route.snapshot.url[1].path === 'new') {
            // creates a new topic
            this.newTopic = true;
            this.editTopic = true;
            this.topic = new ViewTopic();
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
                this.topic = newViewTopic;
                // personalInfoForm is undefined during 'new' and directly after reloading
                if (this.topicForm) {
                    this.patchForm();
                }
            }
        });
    }

    /**
     * Create the absolute path to the corresponding list of speakers
     *
     * @returns the link to the list of speakers as string
     */
    public getSpeakerLink(): string {
        if (!this.newTopic && this.topic) {
            const item = this.repo.getAgendaItem(this.topic.topic);
            if (item) {
                return `/agenda/${item.id}/speakers`;
            }
        }
    }

    /**
     * Handler for the delete button. Uses the PromptService
     */
    public async onDeleteButton(): Promise<void> {
        const content = this.translate.instant('Delete') + ` ${this.topic.title}?`;
        if (await this.promptService.open('Are you sure?', content)) {
            await this.repo.delete(this.topic).then(null, this.raiseError);
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
                return this.operator.hasPerms('agenda.can_manage');
            case 'edit':
                return this.operator.hasPerms('agenda.can_see');
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
