import { Injectable } from '@angular/core';
import { Workflow } from '../../../shared/models/motions/workflow';
import { ViewWorkflow } from '../models/view-workflow';
import { DataSendService } from '../../../core/services/data-send.service';
import { DataStoreService } from '../../../core/services/data-store.service';
import { BaseRepository } from '../../base/base-repository';
import { Identifiable } from '../../../shared/models/base/identifiable';
import { CollectionStringModelMapperService } from '../../../core/services/collectionStringModelMapper.service';
import { WorkflowState } from 'app/shared/models/motions/workflow-state';

/**
 * Repository Services for Categories
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
export class WorkflowRepositoryService extends BaseRepository<ViewWorkflow, Workflow> {
    /**
     * Creates a WorkflowRepository
     * Converts existing and incoming workflow to ViewWorkflows
     * @param DS
     * @param dataSend
     */
    public constructor(
        protected DS: DataStoreService,
        mapperService: CollectionStringModelMapperService,
        private dataSend: DataSendService
    ) {
        super(DS, mapperService, Workflow);
    }

    protected createViewModel(workflow: Workflow): ViewWorkflow {
        return new ViewWorkflow(workflow);
    }

    public async create(newWorkflow: Workflow): Promise<Identifiable> {
        return await this.dataSend.createModel(newWorkflow);
    }

    public async update(workflow: Partial<Workflow>, viewWorkflow: ViewWorkflow): Promise<void> {
        let updateWorkflow: Workflow;
        if (viewWorkflow) {
            updateWorkflow = viewWorkflow.workflow;
        } else {
            updateWorkflow = new Workflow();
        }
        updateWorkflow.patchValues(workflow);
        await this.dataSend.updateModel(updateWorkflow);
    }

    public async delete(viewWorkflow: ViewWorkflow): Promise<void> {
        const workflow = viewWorkflow.workflow;
        await this.dataSend.deleteModel(workflow);
    }

    /**
     * Returns the workflow for the ID
     * @param workflow_id workflow ID
     */
    public getWorkflowByID(workflow_id: number): Workflow {
        const wfList = this.DS.getAll(Workflow);
        return wfList.find(workflow => workflow.id === workflow_id);
    }

    public getAllWorkflowStates(): WorkflowState[]{
        let states: WorkflowState[] = [];
        this.DS.getAll(Workflow).forEach(workflow => {
            states = states.concat(workflow.states);
        })
        return states;
    }

}
