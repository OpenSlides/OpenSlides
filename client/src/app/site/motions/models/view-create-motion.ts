import { WorkflowState } from 'app/shared/models/motions/workflow-state';
import { ViewMotion } from './view-motion';
import { CreateMotion } from './create-motion';
import { ViewUser } from 'app/site/users/models/view-user';
import { ViewMotionBlock } from './view-motion-block';
import { ViewItem } from 'app/site/agenda/models/view-item';
import { ViewCategory } from './view-category';
import { ViewWorkflow } from './view-workflow';
import { ViewListOfSpeakers } from 'app/site/agenda/models/view-list-of-speakers';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';
import { ViewTag } from 'app/site/tags/models/view-tag';
import { ViewMotionChangeRecommendation } from './view-motion-change-recommendation';
import { PersonalNoteContent } from 'app/shared/models/users/personal-note';

/**
 * Create motion class for the View. Its different to ViewMotion in fact that the submitter handling is different
 * on motion creation.
 *
 * @ignore
 */
export class ViewCreateMotion extends ViewMotion {
    protected _model: CreateMotion;

    public get motion(): CreateMotion {
        return this._model;
    }

    public get submitters(): ViewUser[] {
        return this._submitters;
    }

    public get submitters_id(): number[] {
        return this.motion ? this.motion.sorted_submitters_id : null;
    }

    public set submitters(users: ViewUser[]) {
        this._submitters = users;
        this._model.submitters_id = users.map(user => user.id);
    }

    public constructor(
        motion: CreateMotion,
        category?: ViewCategory,
        submitters?: ViewUser[],
        supporters?: ViewUser[],
        workflow?: ViewWorkflow,
        state?: WorkflowState,
        item?: ViewItem,
        listOfSpeakers?: ViewListOfSpeakers,
        block?: ViewMotionBlock,
        attachments?: ViewMediafile[],
        tags?: ViewTag[],
        parent?: ViewMotion,
        changeRecommendations?: ViewMotionChangeRecommendation[],
        amendments?: ViewMotion[],
        personalNote?: PersonalNoteContent
    ) {
        super(
            motion,
            category,
            submitters,
            supporters,
            workflow,
            state,
            item,
            listOfSpeakers,
            block,
            attachments,
            tags,
            parent,
            changeRecommendations,
            amendments,
            personalNote
        );
    }

    public getVerboseName = () => {
        throw new Error('This should not be used');
    };

    /**
     * Duplicate this motion into a copy of itself
     */
    public copy(): ViewCreateMotion {
        return new ViewCreateMotion(
            this._model,
            this._category,
            this._submitters,
            this._supporters,
            this._workflow,
            this._state
        );
    }
}
