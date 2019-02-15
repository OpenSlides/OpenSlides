interface BaseSlideOption {
    key: string;
    displayName: string;
}

export interface SlideDecisionOption extends BaseSlideOption {
    default: boolean;
}

export interface SlideChoiceOption extends BaseSlideOption {
    default: string;
    choices: { value: string; displayName: string }[];
}

export type SlideOption = SlideDecisionOption | SlideChoiceOption;
export type SlideOptions = SlideOption[];

export function isSlideDecisionOption(object: any): object is SlideDecisionOption {
    const option = <SlideDecisionOption>object;
    return (
        option.key !== undefined &&
        option.displayName !== undefined &&
        option.default !== undefined &&
        (<SlideChoiceOption>object).choices === undefined
    );
}

export function isSlideChoiceOption(object: any): object is SlideChoiceOption {
    const option = <SlideChoiceOption>object;
    return (
        option.key !== undefined &&
        option.displayName !== undefined &&
        option.default !== undefined &&
        option.choices !== undefined
    );
}
