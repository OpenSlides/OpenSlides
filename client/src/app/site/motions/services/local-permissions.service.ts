import { Injectable } from '@angular/core';

import { OperatorService } from '../../../core/core-services/operator.service';
import { ViewMotion } from '../models/view-motion';
import { ConfigService } from '../../../core/ui-services/config.service';
import { ConstantsService } from 'app/core/ui-services/constants.service';

interface OpenSlidesSettings {
    MOTIONS_ALLOW_AMENDMENTS_OF_AMENDMENTS: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class LocalPermissionsService {
    public configMinSupporters: number;
    private amendmentEnabled: boolean;
    private amendmentOfAmendment: boolean;

    public constructor(
        private operator: OperatorService,
        private configService: ConfigService,
        private constants: ConstantsService
    ) {
        // load config variables
        this.configService
            .get<number>('motions_min_supporters')
            .subscribe(supporters => (this.configMinSupporters = supporters));
        this.configService
            .get<boolean>('motions_amendments_enabled')
            .subscribe(enabled => (this.amendmentEnabled = enabled));
        this.constants
            .get<OpenSlidesSettings>('OpenSlidesSettings')
            .subscribe(settings => (this.amendmentOfAmendment = settings.MOTIONS_ALLOW_AMENDMENTS_OF_AMENDMENTS));
    }

    /**
     * Determine if the user (Operator) has the correct permission to perform the given action.
     *
     * actions might be:
     * - create
     * - support
     * - unsupport
     * - createpoll
     * - update
     * - update_submitters
     * - delete
     * - change_metadata
     * - reset_state
     * - change_recommendation
     * - can_create_amendments
     * - can_manage_metadata
     * - manage
     *
     * @param action the action the user tries to perform
     * @param motion the motion for which to perform the action
     */
    public isAllowed(action: string, motion?: ViewMotion): boolean {
        switch (action) {
            case 'create':
                return this.operator.hasPerms('motions.can_create');
            case 'support':
                if (!motion) {
                    return false;
                }
                return (
                    this.operator.hasPerms('motions.can_support') &&
                    this.configMinSupporters > 0 &&
                    motion.state.allow_support &&
                    motion.submitters.indexOf(this.operator.user) === -1 &&
                    motion.supporters.indexOf(this.operator.user) === -1
                );
            case 'unsupport':
                if (!motion) {
                    return false;
                }
                return motion.state.allow_support && motion.supporters.indexOf(this.operator.user) !== -1;
            case 'createpoll':
                if (!motion) {
                    return false;
                }
                return (
                    (this.operator.hasPerms('motions.can_manage') ||
                        this.operator.hasPerms('motions.can_manage_metadata')) &&
                    motion.state.allow_create_poll
                );
            case 'update':
                // check also for empty ViewMotion object (e.g. if motion.id is null)
                // important for creating new motion as normal user
                if (!motion || !motion.id) {
                    return false;
                }
                return (
                    this.operator.hasPerms('motions.can_manage') ||
                    (motion.state &&
                        motion.state.allow_submitter_edit &&
                        motion.submitters &&
                        motion.submitters.some(submitter => submitter.id === this.operator.user.id))
                );
            case 'update_submitters':
                return this.operator.hasPerms('motions.can_manage');
            case 'delete':
                if (!motion) {
                    return false;
                }
                return (
                    this.operator.hasPerms('motions.can_manage') &&
                    motion.state.allow_submitter_edit &&
                    motion.submitters.some(submitter => submitter.id === this.operator.user.id)
                );
            case 'change_state':
                // check also for empty ViewMotion object (e.g. if motion.id is null)
                // important for creating new motion as normal user
                if (!motion || !motion.id) {
                    return false;
                }
                return (
                    this.operator.hasPerms('motions.can_manage') ||
                    this.operator.hasPerms('motions.can_manage_metadata') ||
                    (motion.state &&
                        motion.state.allow_submitter_edit &&
                        motion.submitters &&
                        motion.submitters.some(submitter => submitter.id === this.operator.user.id))
                );
            case 'change_metadata':
                return (
                    this.operator.hasPerms('motions.can_manage') ||
                    this.operator.hasPerms('motions.can_manage_metadata')
                );
            case 'can_create_amendments':
                if (!motion) {
                    return false;
                }
                return (
                    this.operator.hasPerms('motions.can_create_amendments') &&
                    this.amendmentEnabled &&
                    (!motion.parent_id || (motion.parent_id && this.amendmentOfAmendment))
                );
            case 'can_manage_metadata':
                return (
                    this.operator.hasPerms('motions.can_manage') &&
                    this.operator.hasPerms('motions.can_manage_metadata')
                );
            case 'manage':
                return this.operator.hasPerms('motions.can_manage');
            default:
                return false;
        }
    }
}
