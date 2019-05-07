/**
 * Wraps a promise and let it reject after the given timeout (in ms), if it was
 * not resolved before this timeout.
 *
 * @param promise The promise to wrap
 * @param timeout The timeout
 * @returns a new Promise
 */
export function TimeoutPromise<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([promise, new Promise((_, reject) => setTimeout(reject, timeout))]) as Promise<T>;
}
