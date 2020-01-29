import { ReversePipe } from './reverse.pipe';

describe('ReversePipe', () => {
    it('create an instance', () => {
        const pipe = new ReversePipe();
        expect(pipe).toBeTruthy();
    });
});
