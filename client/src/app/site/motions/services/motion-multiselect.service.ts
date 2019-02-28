import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { ViewMotion } from '../models/view-motion';
import { ChoiceService } from 'app/core/ui-services/choice.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { WorkflowRepositoryService } from 'app/core/repositories/motions/workflow-repository.service';
import { CategoryRepositoryService } from 'app/core/repositories/motions/category-repository.service';
import { TagRepositoryService } from 'app/core/repositories/tags/tag-repository.service';
import { HttpService } from 'app/core/core-services/http.service';
import { ItemRepositoryService } from 'app/core/repositories/agenda/item-repository.service';
import { Displayable } from 'app/site/base/displayable';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { MotionBlockRepositoryService } from 'app/core/repositories/motions/motion-block-repository.service';
import { TreeService } from 'app/core/ui-services/tree.service';

/**
 * Contains all multiselect actions for the motion list view.
 */
@Injectable({
    providedIn: 'root'
})
export class MotionMultiselectService {
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
        private treeService: TreeService
    ) {}

    /**
     * Deletes the given motions. Asks for confirmation.
     *
     * @param motions The motions to delete
     */
    public async delete(motions: ViewMotion[]): Promise<void> {
        const content = this.translate.instant('This will delete all selected motions.');
        if (await this.promptService.open('Are you sure?', content)) {
            for (const motion of motions) {
                await this.repo.delete(motion);
            }
        }
    }

    /**
     * Moves the related agenda items from the motions as childs under a selected (parent) agenda item.
     */
    public async moveToItem(motions: ViewMotion[]): Promise<void> {
        const title = this.translate.instant('This will move all selected motions as childs to:');
        const choices: (Displayable & Identifiable)[] = this.agendaRepo.getViewModelList();
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
        const title = this.translate.instant('This will set the following state for all selected motions:');
        const choices = this.workflowRepo.getWorkflowStatesForMotions(motions).map(workflowState => ({
            id: workflowState.id,
            label: workflowState.name
        }));
        const selectedChoice = await this.choiceService.open(title, choices);
        if (selectedChoice) {
            await this.repo.setMultiState(motions, selectedChoice.items as number);
        }
    }

    /**
     * Opens a dialog and sets the recommendation to the users choice for all selected motions.
     *
     * @param motions The motions to change
     */
    public async setRecommendation(motions: ViewMotion[]): Promise<void> {
        const title = this.translate.instant('This will set the following recommendation for all selected motions:');
        const choices = this.workflowRepo
            .getWorkflowStatesForMotions(motions)
            .filter(workflowState => !!workflowState.recommendation_label)
            .map(workflowState => ({
                id: workflowState.id,
                label: workflowState.recommendation_label
            }));
        const clearChoice = this.translate.instant('Delete recommendation');
        const selectedChoice = await this.choiceService.open(title, choices, false, null, clearChoice);
        if (selectedChoice) {
            const requestData = motions.map(motion => ({
                id: motion.id,
                recommendation: selectedChoice.action ? 0 : (selectedChoice.items as number)
            }));
            await this.httpService.post('/rest/motions/motion/manage_multiple_recommendation/', {
                motions: requestData
            });
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
            this.categoryRepo.sortViewCategoriesByConfig(this.categoryRepo.getViewModelList()),
            false,
            null,
            clearChoice
        );
        if (selectedChoice) {
            for (const motion of motions) {
                await this.repo.update(
                    { category_id: selectedChoice.action ? null : (selectedChoice.items as number) },
                    motion
                );
            }
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
        const selectedChoice = await this.choiceService.open(title, this.userRepo.getViewModelList(), true, choices);
        if (selectedChoice && selectedChoice.action === choices[0]) {
            const requestData = motions.map(motion => {
                let submitterIds = [...motion.sorted_submitters_id, ...(selectedChoice.items as number[])];
                submitterIds = submitterIds.filter((id, index, self) => self.indexOf(id) === index); // remove duplicates
                return {
                    id: motion.id,
                    submitters: submitterIds
                };
            });
            await this.httpService.post('/rest/motions/motion/manage_multiple_submitters/', { motions: requestData });
        } else if (selectedChoice && selectedChoice.action === choices[1]) {
            const requestData = motions.map(motion => {
                const submitterIdsToRemove = selectedChoice.items as number[];
                const submitterIds = motion.sorted_submitters_id.filter(id => !submitterIdsToRemove.includes(id));
                return {
                    id: motion.id,
                    submitters: submitterIds
                };
            });
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
        const choices = [
            this.translate.instant('Add'),
            this.translate.instant('Remove'),
            this.translate.instant('Clear tags')
        ];
        const selectedChoice = await this.choiceService.open(title, this.tagRepo.getViewModelList(), true, choices);
        if (selectedChoice && selectedChoice.action === choices[0]) {
            const requestData = motions.map(motion => {
                let tagIds = [...motion.tags_id, ...(selectedChoice.items as number[])];
                tagIds = tagIds.filter((id, index, self) => self.indexOf(id) === index); // remove duplicates
                return {
                    id: motion.id,
                    tags: tagIds
                };
            });
            await this.httpService.post('/rest/motions/motion/manage_multiple_tags/', { motions: requestData });
        } else if (selectedChoice && selectedChoice.action === choices[1]) {
            const requestData = motions.map(motion => {
                const tagIdsToRemove = selectedChoice.items as number[];
                const tagIds = motion.tags_id.filter(id => !tagIdsToRemove.includes(id));
                return {
                    id: motion.id,
                    tags: tagIds
                };
            });
            await this.httpService.post('/rest/motions/motion/manage_multiple_tags/', { motions: requestData });
        } else if (selectedChoice && selectedChoice.action === choices[2]) {
            const requestData = motions.map(motion => {
                return {
                    id: motion.id,
                    tags: []
                };
            });
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
        const clearChoice = 'Clear motion block';
        const selectedChoice = await this.choiceService.open(
            title,
            this.motionBlockRepo.getViewModelList(),
            false,
            null,
            clearChoice
        );
        if (selectedChoice) {
            for (const motion of motions) {
                const blockId = selectedChoice.action ? null : (selectedChoice.items as number);
                await this.repo.update({ motion_block_id: blockId }, motion);
            }
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
        const itemsToMove = this.treeService.getTopItemsFromTree(tree, motions);
        const selectableItems = this.treeService.getTreeWithoutSelection(tree, motions);

        const selectedChoice = await this.choiceService.open(title, selectableItems, false, options);
        if (selectedChoice) {
            if (selectedChoice.action === options[0]) {
                // set choice as parent
                this.repo.sortMotionBranches(itemsToMove, selectedChoice.items as number);
            } else if (selectedChoice.action === options[1]) {
                // insert after chosen
                const olderSibling = this.repo.getViewModel(selectedChoice.items as number);
                const parentId = olderSibling ? olderSibling.sort_parent_id : null;
                const siblings = this.repo.getViewModelList().filter(motion => motion.sort_parent_id === parentId);
                const idx = siblings.findIndex(sib => sib.id === olderSibling.id);
                const before = siblings.slice(0, idx + 1);
                const after = siblings.slice(idx + 1);
                const sum = [].concat(before, itemsToMove, after);
                this.repo.sortMotionBranches(sum, parentId);
            }
        }
    }
}
