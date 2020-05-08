/**
 * A mutex as described in every textbook
 *
 * Usage:
 * ```
 * mutex = new Mutex(); // create e.g. as class member
 *
 * // Somewhere in the code to lock (must be async code!)
 * const unlock = await this.mutex.lock()
 * // ...the code to synchronize
 * unlock()
 * ```
 */
export class Mutex {
    private mutex = Promise.resolve();

    public lock(): PromiseLike<() => void> {
        // this will capture the code-to-synchronize
        let begin: (unlock: () => void) => void = () => {};

        // All "requests" to execute code are chained in a promise-chain
        this.mutex = this.mutex.then(() => {
            return new Promise(begin);
        });

        return new Promise(res => {
            begin = res;
        });
    }
}
