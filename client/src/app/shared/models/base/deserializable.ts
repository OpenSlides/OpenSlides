/**
 * Interface tells models to offer a 'deserialize' function
 *
 * Also nested objects and arrays have have to be handled.
 * @example
 * ``` ts
 * const myUser = new User();
 * myUser.deserialize(jsonData);
 * ```
 */
export interface Deserializable {
    /**
     * should be used to assign JSON values to the object itself.
     * @param input
     */
    deserialize(input: object): void;
}
