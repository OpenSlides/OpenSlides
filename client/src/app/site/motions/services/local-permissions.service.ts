import { Injectable } from '@angular/core';
import { OperatorService } from '../../../core/services/operator.service';
import { ViewMotion } from '../models/view-motion';
import { ConfigService } from '../../../core/services/config.service';

@Injectable({
    providedIn: 'root'
})
export class LocalPermissionsService {
    public configMinSupporters: number;

    public constructor(private operator: OperatorService, private configService: ConfigService) {
        // load config variables
        this.configService
            .get('motions_min_supporters')
            .subscribe(supporters => (this.configMinSupporters = supporters));
    }

    /**
     * Should determine if the user (Operator) has the
     * correct permission to perform the given action.
     *
     * actions might be:
     * - support
     * - unsupport
     * - createpoll
     *
     * @param action the action the user tries to perform
     */
    public isAllowed(action: string, motion?: ViewMotion): boolean {
        if (motion) {
            switch (action) {
                case 'support':
                    return (
                        this.operator.hasPerms('motions.can_support') &&
                        this.configMinSupporters > 0 &&
                        motion.state.allow_support &&
                        motion.submitters.indexOf(this.operator.user) === -1 &&
                        motion.supporters.indexOf(this.operator.user) === -1
                    );
                case 'unsupport':
                    return motion.state.allow_support && motion.supporters.indexOf(this.operator.user) !== -1;
                case 'createpoll':
                    return this.operator.hasPerms('motions.can_manage') && motion.state.allow_create_poll;
                default:
                    return false;
            }
        }
    }
}
