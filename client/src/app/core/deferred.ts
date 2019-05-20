/**
 * Helper class to asynchronously wait until certain promises are resolved
 *
 * @example
 * ```ts
 * // myService
 * private loaded: Deferred<void> = new Deferred();
 * // after something was done
 * this.loaded.resolve();
 *
 * // myOtherService or myComponent
 * await this.myService.loaded;
 * //
 * ```
 */
export class Deferred<T = void> extends Promise<T> {
    /**
     * The promise to wait for
     */
    public readonly promise: Promise<T>;

    /**
     * custom resolve function
     */
    private _resolve: (val?: T) => void;

    /**
     * Creates the promise and overloads the resolve function
     */
    public constructor() {
        let preResolve: (val?: T) => void;
        super(resolve => {
            preResolve = resolve;
        });
        this._resolve = preResolve;
    }

    /**
     * Entry point for the resolve function
     */
    public resolve(val?: T): void {
        this._resolve(val);
    }
}
