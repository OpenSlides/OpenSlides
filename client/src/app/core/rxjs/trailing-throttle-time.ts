import { MonoTypeOperatorFunction } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

export function trailingThrottleTime<T = unknown>(time: number): MonoTypeOperatorFunction<T> {
    return throttleTime<T>(time, undefined, { leading: false, trailing: true });
}
