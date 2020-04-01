import { TranslateService } from '@ngx-translate/core';

import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { MotionTitleInformation } from 'app/site/motions/models/view-motion';
import { BaseSlideComponentDirective } from 'app/slides/base-slide-component';

/**
 * Format for referenced motions: A mapping of motion ids to their title information.
 */
export interface ReferencedMotions {
    [id: number]: MotionTitleInformation;
}

/**
 * Base slide for motions and motion blocks. This Provides the functionality of
 * replacing referenced motions (format: `[motion:<id>]`) in strings.
 */
export class BaseMotionSlideComponent<T extends object> extends BaseSlideComponentDirective<T> {
    public constructor(protected translate: TranslateService, protected motionRepo: MotionRepositoryService) {
        super();
    }

    /**
     * Replaces all motion placeholders with the motion titles or `<unknown motion>` if the
     * referenced motion doe snot exist.
     *
     * @param text the text to replace
     * @param referencedMotions an object holding the title information for all referenced motions
     * @returns the new string
     */
    public replaceReferencedMotions(text: string, referencedMotions: ReferencedMotions): string {
        return text.replace(/\[motion:(\d+)\]/g, (match, id) => {
            const titleInformation = referencedMotions[id];
            if (titleInformation) {
                return this.motionRepo.getIdentifierOrTitle(titleInformation);
            } else {
                return this.translate.instant('<unknown motion>');
            }
        });
    }
}
