import { ChartData } from 'app/shared/components/charts/charts.component';
import { MotionPoll, MotionPollMethods, MotionPollWithoutNestedModels } from 'app/shared/models/motions/motion-poll';
import { PollColors, PollState } from 'app/shared/models/poll/base-poll';
import { BaseProjectableViewModel } from 'app/site/base/base-projectable-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewMotionOption } from 'app/site/motions/models/view-motion-option';
import { ViewGroup } from 'app/site/users/models/view-group';
import { ViewUser } from 'app/site/users/models/view-user';

export interface MotionPollTitleInformation {
    title: string;
}

export class ViewMotionPoll extends BaseProjectableViewModel<MotionPoll> implements MotionPollTitleInformation {
    public static COLLECTIONSTRING = MotionPoll.COLLECTIONSTRING;
    protected _collectionString = MotionPoll.COLLECTIONSTRING;

    public get poll(): MotionPoll {
        return this._model;
    }

    public get nextStates(): string[] {
        switch (this.state) {
            case PollState.Created:
                return ['Start'];
            case PollState.Started:
                return null;
            case PollState.Finished:
                return ['Publish', 'Reset'];
            case PollState.Published:
                return ['Reset'];
        }
    }

    public generateChartData(): ChartData {
        const model = this.poll;
        const data: ChartData = [
            ...Object.entries(model.options[0])
                .filter(([key, value]) => {
                    if (model.pollmethod === MotionPollMethods.YN) {
                        return key.toLowerCase() !== 'abstain' && key.toLowerCase() !== 'id';
                    }
                    return key.toLowerCase() !== 'id';
                })
                .map(([key, value]) => ({
                    label: key.toUpperCase(),
                    data: [value],
                    backgroundColor: PollColors[key],
                    hoverBackgroundColor: PollColors[key]
                }))
        ];

        data.push({
            label: 'Votes invalid',
            data: [model.votesinvalid],
            backgroundColor: PollColors.votesinvalid,
            hoverBackgroundColor: PollColors.votesinvalid
        });

        return data;
    }

    public getSlide(): ProjectorElementBuildDeskriptor {
        return {
            getBasicProjectorElement: options => ({
                name: MotionPoll.COLLECTIONSTRING,
                id: this.id,
                getIdentifiers: () => ['name', 'id']
            }),
            slideOptions: [],
            projectionDefaultName: 'motion-poll',
            getDialogTitle: this.getTitle
        };
    }
}

interface TIMotionPollRelations {
    options: ViewMotionOption[];
    voted: ViewUser[];
    groups: ViewGroup[];
}

export interface ViewMotionPoll extends MotionPollWithoutNestedModels, TIMotionPollRelations {}
