import { Deserializable } from './deserializable.model';

/**
 * Abstract base class for a basic implementation of Deserializable.
 * The constructor also gives the possibility to give data that should be serialized.
 */
export abstract class Deserializer implements Deserializable {
    /**
     * Basic constructor with the possibility to give data to deserialize.
     * @param input If data is given, {@method deserialize} will be called with that data
     */
    protected constructor(input?: any) {
        if (input) {
            this.deserialize(input);
        }
    }

    /**
     * should be used to assign JSON values to the object itself.
     * @param input
     */
    public deserialize(input: any): void {
        Object.assign(this, input);
    }
}
