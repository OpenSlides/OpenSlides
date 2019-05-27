import { MotionTitleInformation } from 'app/site/motions/models/view-motion';
import { ReferencedMotions } from '../base/base-motion-slide';

export interface MotionBlockSlideMotionRepresentation extends MotionTitleInformation {
    recommendation?: {
        name: string;
        css_class: string;
    };
    recommendation_extension?: string;

    // This property will be calculated and saved here.
    recommendationLabel?: string;
}

export interface MotionBlockSlideData {
    title: string;
    motions: MotionBlockSlideMotionRepresentation[];
    referenced_motions: ReferencedMotions;
}
