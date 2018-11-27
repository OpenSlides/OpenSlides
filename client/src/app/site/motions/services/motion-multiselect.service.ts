import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { ViewMotion } from '../models/view-motion';
import { ChoiceService } from 'app/core/services/choice.service';
import { PromptService } from 'app/core/services/prompt.service';
import { MotionRepositoryService } from './motion-repository.service';
import { UserRepositoryService } from 'app/site/users/services/user-repository.service';
import { WorkflowRepositoryService } from './workflow-repository.service';
import { CategoryRepositoryService } from './category-repository.service';
import { TagRepositoryService } from 'app/site/tags/services/tag-repository.service';

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
     */
    public constructor(
        private repo: MotionRepositoryService,
        private translate: TranslateService,
        private promptService: PromptService,
        private choiceService: ChoiceService,
        private userRepo: UserRepositoryService,
        private workflowRepo: WorkflowRepositoryService,
        private categoryRepo: CategoryRepositoryService,
        private tagRepo: TagRepositoryService
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
     * Opens a dialog and then sets the status for all motions.
     *
     * @param motions The motions to change
     */
    public async setStatus(motions: ViewMotion[]): Promise<void> {
        const title = this.translate.instant('This will set the state of all selected motions to:');
        const choices = this.workflowRepo.getAllWorkflowStates().map(workflowState => ({
            id: workflowState.id,
            label: workflowState.name
        }));
        const selectedChoice = await this.choiceService.open(title, choices);
        if (selectedChoice) {
            for (const motion of motions) {
                await this.repo.setState(motion, selectedChoice as number);
            }
        }
    }

    /**
     * Opens a dialog and sets the recommendation to the users choice for all selected motions.
     *
     * @param motions The motions to change
     */
    public async setRecommendation(motions: ViewMotion[]): Promise<void> {
        const title = this.translate.instant('This will set the recommendation for all selected motions to:');
        const choices = this.workflowRepo
            .getAllWorkflowStates()
            .filter(workflowState => !!workflowState.recommendation_label)
            .map(workflowState => ({
                id: workflowState.id,
                label: workflowState.recommendation_label
            }));
        const selectedChoice = await this.choiceService.open(title, choices);
        if (selectedChoice) {
            for (const motion of motions) {
                await this.repo.setRecommendation(motion, selectedChoice as number);
            }
        }
    }

    /**
     * Opens a dialog and sets the category for all given motions.
     *
     * @param motions The motions to change
     */
    public async setCategory(motions: ViewMotion[]): Promise<void> {
        const title = this.translate.instant('This will set the category of all selected motions to:');
        const selectedChoice = await this.choiceService.open(title, this.categoryRepo.getViewModelList());
        if (selectedChoice) {
            for (const motion of motions) {
                await this.repo.update({ category_id: selectedChoice as number }, motion);
            }
        }
    }

    /**
     * Opens a dialog and adds the selected submitters for all given motions.
     *
     * @param motions The motions to add the sumbitters to
     */
    public async addSubmitters(motions: ViewMotion[]): Promise<void> {
        const title = this.translate.instant('This will add the following submitters of all selected motions:');
        const selectedChoice = await this.choiceService.open(title, this.userRepo.getViewModelList(), true);
        if (selectedChoice) {
            throw new Error("Not implemented on the server");
        }
    }

    /**
     * Opens a dialog and removes the selected submitters for all given motions.
     *
     * @param motions The motions to remove the submitters from
     */
    public async removeSubmitters(motions: ViewMotion[]): Promise<void> {
        const title = this.translate.instant('This will remove the following submitters from all selected motions:');
        const selectedChoice = await this.choiceService.open(title, this.userRepo.getViewModelList(), true);
        if (selectedChoice) {
            throw new Error("Not implemented on the server");
        }
    }

    /**
     * Opens a dialog and adds the selected tags for all given motions.
     *
     * @param motions The motions to add the tags to
     */
    public async addTags(motions: ViewMotion[]): Promise<void> {
        const title = this.translate.instant('This will add the following tags to all selected motions:');
        const selectedChoice = await this.choiceService.open(title, this.tagRepo.getViewModelList(), true);
        if (selectedChoice) {
            for (const motion of motions) {
                let tagIds = [...motion.tags_id, ...(selectedChoice as number[])];
                tagIds = tagIds.filter((id, index, self) => self.indexOf(id) === index);
                await this.repo.update({ tags_id: tagIds }, motion);
            }
        }
    }

    /**
     * Opens a dialog and removes the selected tags for all given motions.
     *
     * @param motions The motions to remove the tags from
     */
    public async removeTags(motions: ViewMotion[]): Promise<void> {
        const title = this.translate.instant('This will remove the following tags from all selected motions:');
        const selectedChoice = await this.choiceService.open(title, this.tagRepo.getViewModelList(), true);
        if (selectedChoice) {
            for (const motion of motions) {
                const tagIdsToRemove = selectedChoice as number[];
                const tagIds = motion.tags_id.filter(id => !tagIdsToRemove.includes(id));
                await this.repo.update({ tags_id: tagIds }, motion);
            }
        }
    }
}
