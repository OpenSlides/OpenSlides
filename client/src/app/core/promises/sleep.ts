/**
 * Wraps a promise and let it reject after the given timeout (in ms), if it was
 * not resolved before this timeout.
 *
 * @param delay The time to sleep in miliseconds
 * @returns a new Promise
 */
export function SleepPromise(delay: number): Promise<void> {
    return new Promise((resolve, _) => setTimeout(resolve, delay));
}
