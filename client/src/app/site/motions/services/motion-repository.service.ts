import { Injectable } from '@angular/core';

import { DataSendService } from '../../../core/services/data-send.service';
import { Motion } from '../../../shared/models/motions/motion';
import { User } from '../../../shared/models/users/user';
import { Category } from '../../../shared/models/motions/category';
import { Workflow } from '../../../shared/models/motions/workflow';
import { WorkflowState } from '../../../shared/models/motions/workflow-state';
import { ViewMotion } from '../models/view-motion';
import { Observable } from 'rxjs';
import { BaseRepository } from '../../base/base-repository';
import { DataStoreService } from '../../../core/services/data-store.service';

/**
 * Repository Services for motions (and potentially categories)
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
export class MotionRepositoryService extends BaseRepository<ViewMotion, Motion> {
    /**
     * Creates a MotionRepository
     *
     * Converts existing and incoming motions to ViewMotions
     * Handles CRUD using an observer to the DataStore
     * @param DataSend
     */
    public constructor(DS: DataStoreService, private dataSend: DataSendService) {
        super(DS, Motion, [Category, User, Workflow]);
    }

    /**
     * Converts a motion to a ViewMotion and adds it to the store.
     *
     * Foreign references of the motion will be resolved (e.g submitters to users)
     * Expandable to all (server side) changes that might occur on the motion object.
     *
     * @param motion blank motion domain object
     */
    protected createViewModel(motion: Motion): ViewMotion {
        const category = this.DS.get(Category, motion.category_id);
        const submitters = this.DS.getMany(User, motion.submitterIds);
        const supporters = this.DS.getMany(User, motion.supporters_id);
        const workflow = this.DS.get(Workflow, motion.workflow_id);
        let state: WorkflowState = null;
        if (workflow) {
            state = workflow.getStateById(motion.state_id);
        }
        return new ViewMotion(motion, category, submitters, supporters, workflow, state);
    }

    /**
     * Creates a motion
     * Creates a (real) motion with patched data and delegate it
     * to the {@link DataSendService}
     *
     * @param update the form data containing the update values
     * @param viewMotion The View Motion. If not present, a new motion will be created
     * TODO: Remove the viewMotion and make it actually distignuishable from save()
     */
    public create(motion: Motion): Observable<any> {
        if (!motion.supporters_id) {
            delete motion.supporters_id;
        }
        return this.dataSend.createModel(motion);
    }

    /**
     * updates a motion
     *
     * Creates a (real) motion with patched data and delegate it
     * to the {@link DataSendService}
     *
     * @param update the form data containing the update values
     * @param viewMotion The View Motion. If not present, a new motion will be created
     */
    public update(update: Partial<Motion>, viewMotion: ViewMotion): Observable<any> {
        const motion = viewMotion.motion;
        motion.patchValues(update);
        return this.dataSend.updateModel(motion, 'patch');
    }

    /**
     * Deleting a motion.
     *
     * Extract the motion out of the motionView and delegate
     * to {@link DataSendService}
     * @param viewMotion
     */
    public delete(viewMotion: ViewMotion): Observable<any> {
        return this.dataSend.delete(viewMotion.motion);
    }

    /**
     * Format the motion text using the line numbering and change
     * reco algorithm.
     *
     * TODO: Call DiffView and LineNumbering Service here.
     *
     * Can be called from detail view and exporter
     * @param id Motion ID - will be pulled from the repository
     * @param lnMode indicator for the line numbering mode
     * @param crMode indicator for the change reco mode
     */
    public formatMotion(id: number, lnMode: number, crMode: number): string {
        const targetMotion = this.getViewModel(id);

        if (targetMotion && targetMotion.text) {
            let motionText = targetMotion.text;

            // TODO : Use Line numbering service here
            switch (lnMode) {
                case 0: // no line numbers
                    break;
                case 1: // line number inside
                    motionText = 'Get line numbers outside';
                    break;
                case 2: // line number outside
                    motionText = 'Get line numbers inside';
                    break;
            }

            // TODO : Use Diff Service here.
            //        this will(currently) append the previous changes.
            //        update
            switch (crMode) {
                case 0: // Original
                    break;
                case 1: // Changed Version
                    motionText += ' and get changed version';
                    break;
                case 2: // Diff Version
                    motionText += ' and get diff version';
                    break;
                case 3: // Final Version
                    motionText += ' and final version';
                    break;
            }

            return motionText;
        } else {
            return null;
        }
    }
}
