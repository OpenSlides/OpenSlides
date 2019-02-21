export interface MotionBlockSlideMotionRepresentation {
    title: string;
    identifier?: string;
    recommendation?: {
        name: string;
        css_class: string;
    };
    recommendation_extension?: string;
}

export interface MotionBlockSlideData {
    title: string;
    motions: MotionBlockSlideMotionRepresentation[];
}
