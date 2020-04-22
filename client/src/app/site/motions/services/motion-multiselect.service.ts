import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { HttpService } from 'app/core/core-services/http.service';
import { ItemRepositoryService } from 'app/core/repositories/agenda/item-repository.service';
import { CategoryRepositoryService } from 'app/core/repositories/motions/category-repository.service';
import { MotionBlockRepositoryService } from 'app/core/repositories/motions/motion-block-repository.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { WorkflowRepositoryService } from 'app/core/repositories/motions/workflow-repository.service';
import { TagRepositoryService } from 'app/core/repositories/tags/tag-repository.service';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { ChoiceService } from 'app/core/ui-services/choice.service';
import { OverlayService } from 'app/core/ui-services/overlay.service';
import { PersonalNoteService } from 'app/core/ui-services/personal-note.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { TreeService } from 'app/core/ui-services/tree.service';
import { Displayable } from 'app/site/base/displayable';
import { ViewMotion } from '../models/view-motion';

/**
 * Contains all multiselect actions for the motion list view.
 */
@Injectable({
    providedIn: 'root'
})
export class MotionMultiselectService {
    private messageForSpinner = this.translate.instant('Motions are in process. Please wait ...');

    /**
     * Does nothing.
     *
     * @param repo MotionRepositoryService
     * @param translate TranslateService
     * @param promptService
     * @param choiceService
     * @param userRepo
     * @param workflowRepo
     * @param categoryRepo
     * @param tagRepo
     * @param agendaRepo
     * @param motionBlockRepo
     * @param httpService
     * @param treeService
     * @param personalNoteService
     * @param overlayService to show a spinner when http-requests are made.
     */
    public constructor(
        private repo: MotionRepositoryService,
        private translate: TranslateService,
        private promptService: PromptService,
        private choiceService: ChoiceService,
        private userRepo: UserRepositoryService,
        private workflowRepo: WorkflowRepositoryService,
        private categoryRepo: CategoryRepositoryService,
        private tagRepo: TagRepositoryService,
        private agendaRepo: ItemRepositoryService,
        private motionBlockRepo: MotionBlockRepositoryService,
        private httpService: HttpService,
        private treeService: TreeService,
        private personalNoteService: PersonalNoteService,
        private overlayService: OverlayService
    ) {}

    /**
     * Deletes the given motions. Asks for confirmation.
     *
     * @param motions The motions to delete
     */
    public async delete(motions: ViewMotion[]): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete all selected motions?');
        if (await this.promptService.open(title)) {
            let i = 0;

            for (const motion of motions) {
                ++i;
                const message =
                    this.translate.instant(this.messageForSpinner) +
                    `\n${i} ` +
                    this.translate.instant('of') +
                    ` ${motions.length}`;
                this.overlayService.showSpinner(message, true);
                await this.repo.delete(motion);
            }
            this.overlayService.hideSpinner();
        }
    }

    /**
     * Moves the related agenda items from the motions as childs under a selected (parent) agenda item.
     */
    public async moveToItem(motions: ViewMotion[]): Promise<void> {
        const title = this.translate.instant('This will move all selected motions as childs to:');
        const choices = this.agendaRepo.getViewModelListObservable();
        const selectedChoice = await this.choiceService.open(title, choices);
        if (selectedChoice) {
            const requestData = {
                items: motions.map(motion => motion.agenda_item_id),
                parent_id: selectedChoice.items as number
            };
            await this.httpService.post('/rest/agenda/item/assign/', requestData);
        }
    }

    /**
     * Opens a dialog and then sets the status for all motions.
     *
     * @param motions The motions to change
     */
    public async setStateOfMultiple(motions: ViewMotion[]): Promise<void> {
        if (motions.every(motion => motion.workflow_id === motions[0].workflow_id)) {
            const title = this.translate.instant('This will set the following state for all selected motions:');
            const choices = this.workflowRepo.getWorkflowStatesForMotions(motions);
            const selectedChoice = await this.choiceService.open(title, choices);
            if (selectedChoice) {
                const message = `${motions.length} ` + this.translate.instant(this.messageForSpinner);
                this.overlayService.showSpinner(message, true);
                await this.repo.setMultiState(motions, selectedChoice.items as number);
            }
        } else {
            throw new Error(this.translate.instant('You cannot change the state of motions in different workflows!'));
        }
    }

    /**
     * Opens a dialog and sets the recommendation to the users choice for all selected motions.
     *
     * @param motions The motions to change
     */
    public async setRecommendation(motions: ViewMotion[]): Promise<void> {
        if (motions.every(motion => motion.workflow_id === motions[0].workflow_id)) {
            const title = this.translate.instant(
                'This will set the following recommendation for all selected motions:'
            );

            // hacks custom Displayables from recommendations
            // TODO: Recommendations should be an own class
            const choices: Displayable[] = this.workflowRepo
                .getWorkflowStatesForMotions(motions)
                .filter(workflowState => !!workflowState.recommendation_label)
                .map(workflowState => ({
                    id: workflowState.id,
                    getTitle: () => workflowState.recommendation_label,
                    getListTitle: () => workflowState.recommendation_label
                }));
            const clearChoice = this.translate.instant('Delete recommendation');
            const selectedChoice = await this.choiceService.open(title, choices, false, null, clearChoice);
            if (selectedChoice) {
                const requestData = motions.map(motion => ({
                    id: motion.id,
                    recommendation: selectedChoice.action ? 0 : (selectedChoice.items as number)
                }));
                const message = `${motions.length} ` + this.translate.instant(this.messageForSpinner);
                this.overlayService.showSpinner(message, true);
                await this.httpService.post('/rest/motions/motion/manage_multiple_recommendation/', {
                    motions: requestData
                });
            }
        } else {
            throw new Error(
                this.translate.instant('You cannot change the recommendation of motions in different workflows!')
            );
        }
    }

    /**
     * Opens a dialog and sets the category for all given motions.
     *
     * @param motions The motions to change
     */
    public async setCategory(motions: ViewMotion[]): Promise<void> {
        const title = this.translate.instant('This will set the following category for all selected motions:');
        const clearChoice = this.translate.instant('No category');
        const selectedChoice = await this.choiceService.open(
            title,
            this.categoryRepo.getViewModelListObservable(),
            false,
            null,
            clearChoice
        );
        if (selectedChoice) {
            const message = this.translate.instant(this.messageForSpinner);
            this.overlayService.showSpinner(message, true);
            await this.repo.setMultiCategory(motions, selectedChoice.items as number);
        }
    }

    /**
     * Opens a dialog and adds or removes the selected submitters for all given motions.
     *
     * @param motions The motions to add/remove the sumbitters to
     */
    public async changeSubmitters(motions: ViewMotion[]): Promise<void> {
        const title = this.translate.instant(
            'This will add or remove the following submitters for all selected motions:'
        );
        const choices = [this.translate.instant('Add'), this.translate.instant('Remove')];
        const selectedChoice = await this.choiceService.open(
            title,
            this.userRepo.getViewModelListObservable(),
            true,
            choices
        );
        if (selectedChoice) {
            let requestData = null;
            if (selectedChoice.action === choices[0]) {
                requestData = motions.map(motion => {
                    let submitterIds = [...motion.sorted_submitter_ids, ...(selectedChoice.items as number[])];
                    // remove duplicates
                    submitterIds = submitterIds.filter((id, index, self) => self.indexOf(id) === index);
                    return {
                        id: motion.id,
                        submitters: submitterIds
                    };
                });
            } else if (selectedChoice.action === choices[1]) {
                requestData = motions.map(motion => {
                    const submitterIdsToRemove = selectedChoice.items as number[];
                    const submitterIds = motion.sorted_submitter_ids.filter(id => !submitterIdsToRemove.includes(id));
                    return {
                        id: motion.id,
                        submitters: submitterIds
                    };
                });
            }

            const message = `${motions.length} ` + this.translate.instant(this.messageForSpinner);
            this.overlayService.showSpinner(message, true);
            await this.httpService.post('/rest/motions/motion/manage_multiple_submitters/', { motions: requestData });
        }
    }

    /**
     * Opens a dialog and adds/removes the selected tags for all given motions.
     *
     * @param motions The motions to add the tags to
     */
    public async changeTags(motions: ViewMotion[]): Promise<void> {
        const title = this.translate.instant('This will add or remove the following tags for all selected motions:');
        const choices = [this.translate.instant('Add'), this.translate.instant('Remove')];
        const selectedChoice = await this.choiceService.open(
            title,
            this.tagRepo.getViewModelListObservable(),
            true,
            choices,
            this.translate.instant('Clear tags')
        );
        if (selectedChoice) {
            let requestData = null;
            if (selectedChoice.action === choices[0]) {
                requestData = motions.map(motion => {
                    let tagIds = [...motion.tags_id, ...(selectedChoice.items as number[])];
                    tagIds = tagIds.filter((id, index, self) => self.indexOf(id) === index); // remove duplicates
                    return {
                        id: motion.id,
                        tags: tagIds
                    };
                });
            } else if (selectedChoice.action === choices[1]) {
                requestData = motions.map(motion => {
                    const tagIdsToRemove = selectedChoice.items as number[];
                    const tagIds = motion.tags_id.filter(id => !tagIdsToRemove.includes(id));
                    return {
                        id: motion.id,
                        tags: tagIds
                    };
                });
            } else {
                requestData = motions.map(motion => {
                    return {
                        id: motion.id,
                        tags: []
                    };
                });
            }

            const message = `${motions.length} ` + this.translate.instant(this.messageForSpinner);
            this.overlayService.showSpinner(message, true);
            await this.httpService.post('/rest/motions/motion/manage_multiple_tags/', { motions: requestData });
        }
    }

    /**
     * Opens a dialog and changes the motionBlock for all given motions.
     *
     * @param motions The motions for which to change the motionBlock
     */
    public async setMotionBlock(motions: ViewMotion[]): Promise<void> {
        const title = this.translate.instant('This will set the following motion block for all selected motions:');
        const clearChoice = this.translate.instant('Clear motion block');
        const selectedChoice = await this.choiceService.open(
            title,
            this.motionBlockRepo.getViewModelListObservable(),
            false,
            null,
            clearChoice
        );
        if (selectedChoice) {
            const message = this.translate.instant(this.messageForSpinner);
            this.overlayService.showSpinner(message, true);
            const blockId = selectedChoice.action ? null : (selectedChoice.items as number);
            await this.repo.setMultiMotionBlock(motions, blockId);
        }
    }

    /**
     * Triggers the selected motions to be moved in the call-list (sort_parent, weight)
     * as children or as following after a selected motion.
     *
     * @param motions The motions to move
     */
    public async bulkMoveItems(motions: ViewMotion[]): Promise<void> {
        const title = this.translate.instant(
            'This will move all selected motions under or after the following motion in the call list:'
        );
        const options = [this.translate.instant('Set as parent'), this.translate.instant('Insert after')];
        const allMotions = this.repo.getViewModelList();
        const tree = this.treeService.makeTree(allMotions, 'weight', 'sort_parent_id');
        const itemsToMove = this.treeService.getBranchesFromTree(tree, motions);
        const partialTree = this.treeService.getTreeWithoutSelection(tree, motions);
        const availableMotions = this.treeService.getFlatItemsFromTree(partialTree);
        if (!availableMotions.length) {
            throw new Error(this.translate.instant('There are no items left to chose from'));
        } else {
            const selectedChoice = await this.choiceService.open(title, availableMotions, false, options);
            if (selectedChoice) {
                if (!selectedChoice.items) {
                    throw this.translate.instant('No items selected');
                }
                if (selectedChoice.action === options[0]) {
                    const sortedChildTree = this.treeService.insertBranchesIntoTree(
                        partialTree,
                        itemsToMove,
                        selectedChoice.items as number
                    );
                    await this.repo.sortMotions(this.treeService.stripTree(sortedChildTree));
                } else if (selectedChoice.action === options[1]) {
                    const sortedSiblingTree = this.treeService.insertBranchesIntoTree(
                        partialTree,
                        itemsToMove,
                        this.repo.getViewModel(selectedChoice.items as number).parent_id,
                        selectedChoice.items as number
                    );
                    await this.repo.sortMotions(this.treeService.stripTree(sortedSiblingTree));
                }
            }
        }
    }

    /**
     * Bulk sets/unsets the favorite status (after a confirmation dialog)
     *
     * @param motions The motions to set/unset the favorite status for
     */
    public async bulkSetFavorite(motions: ViewMotion[]): Promise<void> {
        const title = this.translate.instant('This will set the favorite status for all selected motions:');
        const options = [this.translate.instant('Set as favorite'), this.translate.instant('Set as not favorite')];
        const selectedChoice = await this.choiceService.open(title, null, false, options);
        if (selectedChoice && motions.length) {
            /**
             * `bulkSetStar` does imply that "true" sets favorites while "false" unsets favorites
             */
            const setOrUnset = selectedChoice.action === options[0];
            const message = this.translate.instant(`I have ${motions.length} favorite motions. Please wait ...`);
            this.overlayService.showSpinner(message, true);
            await this.personalNoteService.bulkSetStar(motions, setOrUnset);
        }
    }
}
