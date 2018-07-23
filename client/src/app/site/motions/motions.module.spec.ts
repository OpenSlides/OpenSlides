import { MotionsModule } from './motions.module';

describe('MotionsModule', () => {
    let motionsModule: MotionsModule;

    beforeEach(() => {
        motionsModule = new MotionsModule();
    });

    it('should create an instance', () => {
        expect(motionsModule).toBeTruthy();
    });
});
