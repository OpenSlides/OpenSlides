export interface ProjectorDecisionOption {
    key: string;
    displayName: string;
    default: string;
}

export interface ProjectorChoiceOption extends ProjectorDecisionOption {
    choices: { value: string; displayName: string }[];
}

export type ProjectorOption = ProjectorDecisionOption | ProjectorChoiceOption;
export type ProjectorOptions = ProjectorOption[];

export function isProjectorDecisionOption(object: any): object is ProjectorDecisionOption {
    const option = <ProjectorDecisionOption>object;
    return (
        option.key !== undefined &&
        option.displayName !== undefined &&
        option.default !== undefined &&
        (<ProjectorChoiceOption>object).choices === undefined
    );
}

export function isProjectorChoiceOption(object: any): object is ProjectorChoiceOption {
    const option = <ProjectorChoiceOption>object;
    return (
        option.key !== undefined &&
        option.displayName !== undefined &&
        option.default !== undefined &&
        option.choices !== undefined
    );
}
