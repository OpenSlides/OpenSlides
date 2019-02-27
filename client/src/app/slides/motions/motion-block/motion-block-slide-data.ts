export interface MotionTitleInformation {
    title: string;
    identifier?: string;
}

export interface MotionBlockSlideMotionRepresentation extends MotionTitleInformation {
    recommendation?: {
        name: string;
        css_class: string;
    };
    recommendation_extension?: string;
}

export interface MotionBlockSlideData {
    title: string;
    motions: MotionBlockSlideMotionRepresentation[];
    referenced_motions: { [id: number]: MotionTitleInformation };
}
