import { Injectable } from '@angular/core';

import { OperatorService, Permission } from 'app/core/core-services/operator.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { ViewMotion } from '../models/view-motion';

@Injectable({
    providedIn: 'root'
})
export class LocalPermissionsService {
    public configMinSupporters: number;
    private amendmentEnabled: boolean;
    private amendmentOfAmendment: boolean;

    public constructor(private operator: OperatorService, private configService: ConfigService) {
        // load config variables
        this.configService
            .get<number>('motions_min_supporters')
            .subscribe(supporters => (this.configMinSupporters = supporters));
        this.configService
            .get<boolean>('motions_amendments_enabled')
            .subscribe(enabled => (this.amendmentEnabled = enabled));
        this.configService
            .get<boolean>('motions_amendments_of_amendments')
            .subscribe(enabled => (this.amendmentOfAmendment = enabled));
    }

    /**
     * Determine if the operator is allowed to access the per line dot-menu
     * in mobile mode
     */
    public canAccessMobileDotMenu(): boolean {
        return this.operator.hasPerms(Permission.agendaCanSeeListOfSpeakers, Permission.coreCanManageProjector);
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
            case 'create': {
                return this.operator.hasPerms(Permission.motionsCanCreate);
            }
            case 'support': {
                if (!motion || !motion.state) {
                    return false;
                }
                return (
                    this.operator.hasPerms(Permission.motionsCanSupport) &&
                    this.configMinSupporters > 0 &&
                    motion.state &&
                    motion.state.allow_support &&
                    motion.submitters &&
                    !motion.submittersAsUsers.includes(this.operator.viewUser) &&
                    motion.supporters &&
                    !motion.supporters.includes(this.operator.viewUser)
                );
            }
            case 'unsupport': {
                if (!motion) {
                    return false;
                }
                return (
                    motion.state &&
                    motion.state.allow_support &&
                    motion.supporters &&
                    motion.supporters.indexOf(this.operator.viewUser) !== -1
                );
            }
            case 'createpoll': {
                if (!motion) {
                    return false;
                }
                return (
                    (this.operator.hasPerms(Permission.motionsCanManage) ||
                        this.operator.hasPerms(Permission.motionsCanManageMetadata)) &&
                    motion.state &&
                    motion.state.allow_create_poll
                );
            }
            case 'update': {
                // check also for empty ViewMotion object (e.g. if motion.id is null)
                // important for creating new motion as normal user
                if (!motion || !motion.id) {
                    return false;
                }
                return (
                    this.operator.hasPerms(Permission.motionsCanManage) ||
                    (motion.state &&
                        motion.state.allow_submitter_edit &&
                        motion.submitters &&
                        motion.submitters.length &&
                        !this.operator.isAnonymous &&
                        motion.submitters.some(submitter => submitter.user_id === this.operator.user.id))
                );
            }
            case 'update_submitters': {
                return this.operator.hasPerms(Permission.motionsCanManage);
            }
            case 'delete': {
                if (!motion) {
                    return false;
                }
                return (
                    this.operator.hasPerms(Permission.motionsCanManage) &&
                    motion.state &&
                    motion.state.allow_submitter_edit &&
                    motion.submitters &&
                    motion.submitters.length &&
                    motion.submitters.some(submitter => submitter.user_id === this.operator.user.id)
                );
            }
            case 'change_state': {
                // check also for empty ViewMotion object (e.g. if motion.id is null)
                // important for creating new motion as normal user
                if (!motion || !motion.id) {
                    return false;
                }
                return (
                    this.operator.hasPerms(Permission.motionsCanManage) ||
                    this.operator.hasPerms(Permission.motionsCanManageMetadata) ||
                    (motion.state &&
                        motion.state.allow_submitter_edit &&
                        !this.operator.isAnonymous &&
                        motion.submitters &&
                        motion.submitters.some(submitter => submitter.user_id === this.operator.user.id))
                );
            }
            case 'change_metadata': {
                return (
                    this.operator.hasPerms(Permission.motionsCanManage) ||
                    this.operator.hasPerms(Permission.motionsCanManageMetadata)
                );
            }
            case 'can_create_amendments': {
                if (!motion) {
                    return false;
                }
                return (
                    this.operator.hasPerms(Permission.motionsCanCreateAmendments) &&
                    this.amendmentEnabled &&
                    (!motion.parent_id || (motion.parent_id && this.amendmentOfAmendment))
                );
            }
            case 'can_manage_metadata': {
                return (
                    this.operator.hasPerms(Permission.motionsCanManage) &&
                    this.operator.hasPerms(Permission.motionsCanManageMetadata)
                );
            }
            case 'can_manage_config': {
                return this.operator.hasPerms(Permission.coreCanManageConfig);
            }
            case 'manage': {
                return this.operator.hasPerms(Permission.motionsCanManage);
            }
            default: {
                return false;
            }
        }
    }
}
