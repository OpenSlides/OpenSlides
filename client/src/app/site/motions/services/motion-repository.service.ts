import { Injectable } from '@angular/core';

import { DataSendService } from '../../../core/services/data-send.service';
import { OpenSlidesComponent } from '../../../openslides.component';
import { Motion } from '../../../shared/models/motions/motion';
import { User } from '../../../shared/models/users/user';
import { Category } from '../../../shared/models/motions/category';
import { Workflow } from '../../../shared/models/motions/workflow';
import { WorkflowState } from '../../../shared/models/motions/workflow-state';
import { ViewMotion } from '../models/view-motion';
import { Observable, BehaviorSubject } from 'rxjs';

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
export class MotionRepositoryService extends OpenSlidesComponent {
    /**
     * Stores all the viewMotion in an object
     */
    private viewMotionStore: { [motionId: number]: ViewMotion } = {};

    /**
     * Stores subjects to viewMotions in a list
     */
    private viewMotionSubjects: { [motionId: number]: BehaviorSubject<ViewMotion> } = {};

    /**
     * Observable subject for the whole list
     */
    private viewMotionListSubject: BehaviorSubject<ViewMotion[]> = new BehaviorSubject<ViewMotion[]>(null);

    /**
     * Creates a MotionRepository
     *
     * Converts existing and incoming motions to ViewMotions
     * Handles CRUD using an observer to the DataStore
     * @param DataSend
     */
    public constructor(private dataSend: DataSendService) {
        super();

        this.populateViewMotions();

        // Could be raise in error if the root injector is not known
        this.DS.changeObservable.subscribe(model => {
            if (model instanceof Motion) {
                // Add new and updated motions to the viewMotionStore
                this.AddViewMotion(model);
                this.updateObservables(model.id);
            } else if (model instanceof Category || model instanceof User || model instanceof Workflow) {
                // if an domain object we need was added or changed, update ViewMotionStore
                this.getViewMotionList().forEach(viewMotion => {
                    viewMotion.updateValues(model);
                });
                this.updateObservables(model.id);
            }
        });

        // Watch the Observables for deleting
        this.DS.deletedObservable.subscribe(model => {
            if (model.collection === 'motions/motion') {
                delete this.viewMotionStore[model.id];
                this.updateObservables(model.id);
            }
        });
    }

    /**
     * called from the constructor.
     *
     * Populate the local viewMotionStore with ViewMotion Objects.
     * Does nothing if the database was not created yet.
     */
    private populateViewMotions(): void {
        this.DS.getAll<Motion>(Motion).forEach(motion => {
            this.AddViewMotion(motion);
            this.updateViewMotionObservable(motion.id);
        });
        this.updateViewMotionListObservable();
    }

    /**
     * Converts a motion to a ViewMotion and adds it to the store.
     *
     * Foreign references of the motion will be resolved (e.g submitters to users)
     * Expandable to all (server side) changes that might occur on the motion object.
     *
     * @param motion blank motion domain object
     */
    private AddViewMotion(motion: Motion): void {
        const category = this.DS.get(Category, motion.category_id);
        const submitters = this.DS.getMany(User, motion.submitterIds);
        const supporters = this.DS.getMany(User, motion.supporters_id);
        const workflow = this.DS.get(Workflow, motion.workflow_id);
        let state: WorkflowState = null;
        if (workflow) {
            state = workflow.getStateById(motion.state_id);
        }
        this.viewMotionStore[motion.id] = new ViewMotion(motion, category, submitters, supporters, workflow, state);
    }

    /**
     * Creates and updates a motion
     *
     * Creates a (real) motion with patched data and delegate it
     * to the {@link DataSendService}
     *
     * @param update the form data containing the update values
     * @param viewMotion The View Motion. If not present, a new motion will be created
     */
    public saveMotion(update: any, viewMotion?: ViewMotion): Observable<any> {
        let updateMotion: Motion;

        if (viewMotion) {
            // implies that an existing motion was updated
            updateMotion = viewMotion.motion;
        } else {
            // implies that a new motion was created
            updateMotion = new Motion();
        }
        updateMotion.patchValues(update);
        return this.dataSend.saveModel(updateMotion);
    }

    /**
     * returns the current observable MotionView
     */
    public getViewMotionObservable(id: number): Observable<ViewMotion> {
        if (!this.viewMotionSubjects[id]) {
            this.updateViewMotionObservable(id);
        }
        return this.viewMotionSubjects[id].asObservable();
    }

    /**
     * return the Observable of the whole store
     */
    public getViewMotionListObservable(): Observable<ViewMotion[]> {
        return this.viewMotionListSubject.asObservable();
    }

    /**
     * Deleting a motion.
     *
     * Extract the motion out of the motionView and delegate
     * to {@link DataSendService}
     * @param viewMotion
     */
    public deleteMotion(viewMotion: ViewMotion): Observable<any> {
        return this.dataSend.delete(viewMotion.motion);
    }

    /**
     * Updates the ViewMotion observable using a ViewMotion corresponding to the id
     */
    private updateViewMotionObservable(id: number): void {
        if (!this.viewMotionSubjects[id]) {
            this.viewMotionSubjects[id] = new BehaviorSubject<ViewMotion>(null);
        }
        this.viewMotionSubjects[id].next(this.viewMotionStore[id]);
    }

    /**
     * helper function to return the viewMotions as array
     */
    private getViewMotionList(): ViewMotion[] {
        return Object.values(this.viewMotionStore);
    }

    /**
     * update the observable of the list
     */
    private updateViewMotionListObservable(): void {
        this.viewMotionListSubject.next(this.getViewMotionList());
    }

    /**
     * Triggers both the observable update routines
     */
    private updateObservables(id: number): void {
        this.updateViewMotionListObservable();
        this.updateViewMotionObservable(id);
    }
}
