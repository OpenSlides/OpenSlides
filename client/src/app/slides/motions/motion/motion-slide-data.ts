import { MotionTitleInformation } from 'app/site/motions/models/view-motion';
import { ChangeRecoMode, LineNumberingMode } from 'app/site/motions/motions.constants';
import { ReferencedMotions } from '../base/base-motion-slide';

/**
 * This interface describes the data returned by the server about an amendment.
 * This object is used if actually the motion is shown and the amendment is shown in the context of the motion.
 */
export interface MotionSlideDataAmendment {
    id: number;
    title: string;
    amendment_paragraphs: string[];
    change_recommendations: MotionSlideDataChangeReco[];
    merge_amendment_into_final: number;
    merge_amendment_into_diff: number;
}

/**
 * This interface describes the data returned by the server about a motion that is changed by an amendment.
 * It only contains the data necessary for rendering the amendment's diff.
 */
export interface MotionSlideDataBaseMotion {
    identifier: string;
    title: string;
    text: string;
}

/**
 * This interface describes the data returned by the server about a statute paragraph that is changed by an amendment.
 * It only contains the data necessary for rendering the amendment's diff.
 */
export interface MotionSlideDataBaseStatute {
    title: string;
    text: string;
}

/**
 * This interface describes the data returned by the server about a change recommendation.
 */
export interface MotionSlideDataChangeReco {
    creation_time: string;
    id: number;
    internal: boolean;
    line_from: number;
    line_to: number;
    motion_id: number;
    other_description: string;
    rejected: false;
    text: string;
    type: number;
}

/**
 * Hint: defined on server-side in the file /openslides/motions/projector.py
 *
 * This interface describes either an motion (with all amendments and change recommendations enbedded)
 * or an amendment (with the bas motion embedded).
 */
export interface MotionSlideData {
    identifier: string;
    title: string;
    preamble: string;
    text: string;
    reason?: string;
    is_child: boolean;
    show_meta_box: boolean;
    submitters?: string[];
    recommender?: string;
    recommendation?: string;
    recommendation_extension?: string;
    recommendation_referencing_motions?: MotionTitleInformation[];
    referenced_motions?: ReferencedMotions;
    base_motion?: MotionSlideDataBaseMotion;
    base_statute?: MotionSlideDataBaseStatute;
    amendment_paragraphs: string[];
    change_recommendations: MotionSlideDataChangeReco[];
    amendments: MotionSlideDataAmendment[];
    modified_final_version?: string;
    line_length: number;
    line_numbering_mode: LineNumberingMode;
    change_recommendation_mode: ChangeRecoMode;
}
