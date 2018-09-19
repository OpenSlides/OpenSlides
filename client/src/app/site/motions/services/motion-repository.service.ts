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
    public create(update: any, viewMotion?: ViewMotion): Observable<any> {
        return this.update(update, viewMotion);
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
    public update(update: any, viewMotion?: ViewMotion): Observable<any> {
        let updateMotion: Motion;
        if (viewMotion) {
            // implies that an existing motion was updated
            updateMotion = viewMotion.motion;
        } else {
            // implies that a new motion was created
            updateMotion = new Motion();
        }
        // submitters: User[] -> submitter: MotionSubmitter[]
        const submitters = update.submitters as User[];
        // The server doesn't really accept MotionSubmitter arrays on create.
        // We simply need to send an number[] on create.
        // MotionSubmitter[] should be send on update
        update.submitters = undefined;
        const submitterIds: number[] = [];
        if (submitters.length > 0) {
            submitters.forEach(submitter => {
                submitterIds.push(submitter.id);
            });
        }
        update.submitters_id = submitterIds;
        // supporters[]: User -> supporters_id: number[];
        const supporters = update.supporters_id as User[];
        const supporterIds: number[] = [];
        if (supporters.length > 0) {
            supporters.forEach(supporter => {
                supporterIds.push(supporter.id);
            });
        }
        update.supporters_id = supporterIds;
        // category_id: Category -> category_id: number;
        const category = update.category_id as Category;
        update.category_id = undefined;
        if (category) {
            update.category_id = category.id;
        }
        // Update the Motion
        updateMotion.patchValues(update);
        return this.dataSend.saveModel(updateMotion);
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
}
