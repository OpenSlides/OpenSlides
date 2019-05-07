import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { CategoryRepositoryService } from 'app/core/repositories/motions/category-repository.service';
import { ChoiceDialogOptions } from 'app/shared/components/choice-dialog/choice-dialog.component';
import { ChoiceService } from 'app/core/ui-services/choice.service';
import { Displayable } from 'app/site/base/displayable';
import { HttpService } from 'app/core/core-services/http.service';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { ItemRepositoryService } from 'app/core/repositories/agenda/item-repository.service';
import { MotionBlockRepositoryService } from 'app/core/repositories/motions/motion-block-repository.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { PersonalNoteService } from 'app/core/ui-services/personal-note.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { TagRepositoryService } from 'app/core/repositories/tags/tag-repository.service';
import { TreeService } from 'app/core/ui-services/tree.service';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { ViewMotion } from '../models/view-motion';
import { WorkflowRepositoryService } from 'app/core/repositories/motions/workflow-repository.service';
import { SpinnerService } from 'app/core/ui-services/spinner.service';

/**
 * Contains all multiselect actions for the motion list view.
 */
@Injectable({
    providedIn: 'root'
})
export class MotionMultiselectService {
    private messageForSpinner = 'Motions are in process. Please wait...';

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
     * @param spinnerService to show a spinner when http-requests are made.
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
        private spinnerService: SpinnerService
    ) {}

    /**
     * Deletes the given motions. Asks for confirmation.
     *
     * @param motions The motions to delete
     */
    public async delete(motions: ViewMotion[]): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete all selected motions?');
        if (await this.promptService.open(title, null)) {
            let i = 0;

            for (const motion of motions) {
                ++i;
                const message =
                    this.translate.instant(this.messageForSpinner) +
                    `\n${i} ` +
                    this.translate.instant('of') +
                    ` ${motions.length}`;
                this.spinnerService.setVisibility(true, message);
                await this.repo.delete(motion);
            }
            this.spinnerService.setVisibility(false);
        }
    }

    /**
     * Moves the related agenda items from the motions as childs under a selected (parent) agenda item.
     */
    public async moveToItem(motions: ViewMotion[]): Promise<void> {
        const title = this.translate.instant('This will move all selected motions as childs to:');
        const choices: (Displayable & Identifiable)[] = this.agendaRepo.getSortedViewModelList();
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
            const message = `${motions.length} ` + this.translate.instant(this.messageForSpinner);
            this.spinnerService.setVisibility(true, message);
            await this.repo.setMultiState(motions, selectedChoice.items as number).catch(error => {
                this.spinnerService.setVisibility(false);
                throw error;
            });
            this.spinnerService.setVisibility(false);
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

            const message = `${motions.length} ` + this.translate.instant(this.messageForSpinner);
            this.spinnerService.setVisibility(true, message);
            await this.httpService
                .post('/rest/motions/motion/manage_multiple_recommendation/', {
                    motions: requestData
                })
                .catch(error => {
                    this.spinnerService.setVisibility(false);
                    throw error;
                });
            this.spinnerService.setVisibility(false);
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
            this.categoryRepo.getSortedViewModelList(),
            false,
            null,
            clearChoice
        );
        if (selectedChoice) {
            let i = 0;
            for (const motion of motions) {
                ++i;
                const message =
                    this.translate.instant(this.messageForSpinner) +
                    `\n${i} ` +
                    this.translate.instant('of') +
                    ` ${motions.length}`;
                this.spinnerService.setVisibility(true, message);
                await this.repo.update(
                    { category_id: selectedChoice.action ? null : (selectedChoice.items as number) },
                    motion
                );
            }
            this.spinnerService.setVisibility(false);
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
            this.userRepo.getSortedViewModelList(),
            true,
            choices
        );
        if (selectedChoice) {
            let requestData = null;
            if (selectedChoice.action === choices[0]) {
                requestData = motions.map(motion => {
                    let submitterIds = [...motion.sorted_submitters_id, ...(selectedChoice.items as number[])];
                    submitterIds = submitterIds.filter((id, index, self) => self.indexOf(id) === index); // remove duplicates
                    return {
                        id: motion.id,
                        submitters: submitterIds
                    };
                });
                // await this.httpService.post('/rest/motions/motion/manage_multiple_submitters/', { motions: requestData });
            } else if (selectedChoice.action === choices[1]) {
                requestData = motions.map(motion => {
                    const submitterIdsToRemove = selectedChoice.items as number[];
                    const submitterIds = motion.sorted_submitters_id.filter(id => !submitterIdsToRemove.includes(id));
                    return {
                        id: motion.id,
                        submitters: submitterIds
                    };
                });
            }

            const message = `${motions.length} ` + this.translate.instant(this.messageForSpinner);
            this.spinnerService.setVisibility(true, message);
            await this.httpService.post('/rest/motions/motion/manage_multiple_submitters/', { motions: requestData });
            this.spinnerService.setVisibility(false);
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
        const selectedChoice = await this.choiceService.open(
            title,
            this.tagRepo.getSortedViewModelList(),
            true,
            choices
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
                // await this.httpService.post('/rest/motions/motion/manage_multiple_tags/', { motions: requestData });
            } else if (selectedChoice.action === choices[1]) {
                requestData = motions.map(motion => {
                    const tagIdsToRemove = selectedChoice.items as number[];
                    const tagIds = motion.tags_id.filter(id => !tagIdsToRemove.includes(id));
                    return {
                        id: motion.id,
                        tags: tagIds
                    };
                });
                // await this.httpService.post('/rest/motions/motion/manage_multiple_tags/', { motions: requestData });
            } else if (selectedChoice.action === choices[2]) {
                requestData = motions.map(motion => {
                    return {
                        id: motion.id,
                        tags: []
                    };
                });
            }

            const message = `${motions.length} ` + this.translate.instant(this.messageForSpinner);
            this.spinnerService.setVisibility(true, message);
            await this.httpService.post('/rest/motions/motion/manage_multiple_tags/', { motions: requestData });
            this.spinnerService.setVisibility(false);
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
            this.motionBlockRepo.getSortedViewModelList(),
            false,
            null,
            clearChoice
        );
        if (selectedChoice) {
            let i = 0;
            for (const motion of motions) {
                ++i;
                const message =
                    this.translate.instant(this.messageForSpinner) +
                    `\n${i} ` +
                    this.translate.instant('of') +
                    ` ${motions.length}`;
                this.spinnerService.setVisibility(true, message);
                const blockId = selectedChoice.action ? null : (selectedChoice.items as number);
                await this.repo.update({ motion_block_id: blockId }, motion);
            }
            this.spinnerService.setVisibility(false);
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
                const siblings = allMotions.filter(motion => motion.sort_parent_id === parentId);
                const idx = siblings.findIndex(sib => sib.id === olderSibling.id);
                const before = siblings.slice(0, idx + 1);
                const after = siblings.slice(idx + 1);
                const sum = [].concat(before, itemsToMove, after);
                this.repo.sortMotionBranches(sum, parentId);
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
        const choices: ChoiceDialogOptions = [
            { id: 1, label: this.translate.instant('Set as favorite') },
            { id: 2, label: this.translate.instant('Set as not favorite') }
        ];
        const selectedChoice = await this.choiceService.open(title, choices);
        if (selectedChoice && motions.length) {
            const message = this.translate.instant(`I have ${motions.length} favorite motions. Please wait...`);
            const star = (selectedChoice.items as number) === choices[0].id;
            this.spinnerService.setVisibility(true, message);
            await this.personalNoteService.bulkSetStar(motions, star);
            this.spinnerService.setVisibility(false);
        }
    }
}
