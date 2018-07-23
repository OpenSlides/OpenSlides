import { Deserializable } from '../deserializable.model';

/**
 * Content of the 'assignment_related_users' property
 * @ignore
 */
export class AssignmentUser implements Deserializable {
    id: number;
    user_id: number;
    elected: boolean;
    assignment_id: number;
    weight: number;

    /**
     * Needs to be completely optional because assignment has (yet) the optional parameter 'assignment_related_users'
     * @param id
     * @param user_id
     * @param elected
     * @param assignment_id
     * @param weight
     */
    constructor(id?: number, user_id?: number, elected?: boolean, assignment_id?: number, weight?: number) {
        this.id = id;
        this.user_id = user_id;
        this.elected = elected;
        this.assignment_id = assignment_id;
        this.weight = weight;
    }

    deserialize(input: any): this {
        Object.assign(this, input);
        return this;
    }
}
