export interface MotionsMotionSlideData {
    identifier: string;
    title: string;
    text: string;
    reason?: string;
    is_child: boolean;
    show_meta_box: boolean;
    submitter?: string[];
    recommender?: string;
    recommendation?: string;
    recommendation_extension?: string;
    amendment_paragraphs: { paragraph: string }[];
    change_recommendations: object[];
    modified_final_version?: string;
}
