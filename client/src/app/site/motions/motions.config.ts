import { AppConfig } from '../base/app-config';
import { Motion } from '../../shared/models/motions/motion';
import { Category } from '../../shared/models/motions/category';
import { Workflow } from '../../shared/models/motions/workflow';
import { MotionCommentSection } from '../../shared/models/motions/motion-comment-section';
import { MotionChangeReco } from '../../shared/models/motions/motion-change-reco';
import { MotionBlock } from '../../shared/models/motions/motion-block';
import { StatuteParagraph } from '../../shared/models/motions/statute-paragraph';

export const MotionsAppConfig: AppConfig = {
    name: 'motions',
    models: [
        { collectionString: 'motions/motion', model: Motion },
        { collectionString: 'motions/category', model: Category },
        { collectionString: 'motions/workflow', model: Workflow },
        { collectionString: 'motions/motion-comment-section', model: MotionCommentSection },
        { collectionString: 'motions/motion-change-recommendation', model: MotionChangeReco },
        { collectionString: 'motions/motion-block', model: MotionBlock },
        { collectionString: 'motions/statute-paragraph', model: StatuteParagraph }
    ],
    mainMenuEntries: [
        {
            route: '/motions',
            displayName: 'Motions',
            icon: 'file-alt',
            weight: 300,
            permission: 'motions.can_see'
        }
    ]
};
