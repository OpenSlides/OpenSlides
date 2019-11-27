import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { RelationDefinition } from 'app/core/definitions/relations';
import { Workflow } from 'app/shared/models/motions/workflow';
import { ViewMotion } from 'app/site/motions/models/view-motion';
import { ViewState } from 'app/site/motions/models/view-state';
import { ViewWorkflow, WorkflowTitleInformation } from 'app/site/motions/models/view-workflow';
import { BaseRepository } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { DataSendService } from '../../core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';

const WorkflowRelations: RelationDefinition[] = [
    {
        type: 'O2M',
        ownIdKey: 'states_id',
        ownKey: 'states',
        foreignViewModel: ViewState
    },
    {
        type: 'M2O',
        ownIdKey: 'first_state_id',
        ownKey: 'first_state',
        foreignViewModel: ViewState
    }
];

/**
 * Repository Services for Workflows
 *
 * The repository is meant to process domain objects (those found under
 * shared/models), so components can display them and interact with them.
 *
 * Rather than manipulating models directly, the repository is meant to
 * inform the {@link DataSendService} about changes which will send
 * them to the Server.
 */
@Injectable({
    providedIn: 'root'
})
export class WorkflowRepositoryService extends BaseRepository<ViewWorkflow, Workflow, WorkflowTitleInformation> {
    /**
     * Creates a WorkflowRepository
     * Converts existing and incoming workflow to ViewWorkflows
     *
     * @param DS Accessing the data store
     * @param mapperService mapping models
     * @param dataSend sending data to the server
     * @param httpService HttpService
     */
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        relationManager: RelationManagerService
    ) {
        super(
            DS,
            dataSend,
            mapperService,
            viewModelStoreService,
            translate,
            relationManager,
            Workflow,
            WorkflowRelations
        );
    }

    public getTitle = (titleInformation: WorkflowTitleInformation) => {
        return titleInformation.name;
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Workflows' : 'Workflow');
    };

    /**
     * Returns all workflowStates that cover the list of viewMotions given
     *
     * @param motions The motions to get the workflows from
     * @returns The workflow states to the given motion
     */
    public getWorkflowStatesForMotions(motions: ViewMotion[]): ViewState[] {
        let states: ViewState[] = [];
        const workflowIds = motions
            .map(motion => motion.workflow_id)
            .filter((value, index, self) => self.indexOf(value) === index);
        workflowIds.forEach(id => {
            const workflow = this.getViewModel(id);
            states = states.concat(workflow.states);
        });
        return states;
    }
}
