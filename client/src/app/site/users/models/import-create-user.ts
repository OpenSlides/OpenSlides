import { User } from 'app/shared/models/users/user';

/**
 * Interface for correlating between strings representing BaseModels and existing
 * BaseModels.
 */
export interface CsvMapping {
    name: string;
    id?: number;
    multiId?: number[];
}

/**
 * View class for a new User during text imports. Offers a mapping and matching
 * to secondary import data (groups)
 *
 * @ignore
 */
export class ImportCreateUser extends User {
    /**
     * Mapping for a new/existing groups.
     */
    public csvGroups: CsvMapping[] = [];

    public title: string;

    /**
     * Getter if the minimum requrements for a user are met: A name
     *
     * @returns false if the user has neither first nor last name nor username
     */
    public get isValid(): boolean {
        return !!(this.first_name || this.last_name || this.username);
    }

    /**
     * takes a list of solved group maps to update. Returns the amount of
     * entries that remain unmatched
     *
     * @param groups
     */
    public solveGroups(recentlyCreatedGroups: CsvMapping[]): void {
        const groups = this.csvGroups;
        const directIds = groups.filter(directGroup => directGroup.id).map(directGroup => directGroup.id);
        const groupsWithoutId = groups.filter(noIdGroup => !noIdGroup.id);
        const transferedIds = recentlyCreatedGroups
            .filter(newGroup => groupsWithoutId.find(noId => noId.name === newGroup.name))
            .map(newGroup => newGroup.id);
        this.groups_id = directIds.concat(transferedIds);
    }
}
