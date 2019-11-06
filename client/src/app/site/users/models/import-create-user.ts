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
    public solveGroups(groups: CsvMapping[]): number {
        let open = 0;
        const ids: number[] = [];
        this.csvGroups.forEach(group => {
            if (group.id) {
                ids.push(group.id);
                return;
            }
            if (!groups.length) {
                open += 1;
                return;
            }
            const mapped = groups.find(newGroup => newGroup.name === group.name);
            if (mapped) {
                group.id = mapped.id;
                ids.push(mapped.id);
            } else {
                open += 1;
            }
        });
        this.groups_id = ids;
        return open;
    }
}
