import { TagModule } from './tag.module';

describe('MotionsModule', () => {
    let tagModule: TagModule;

    beforeEach(() => {
        tagModule = new TagModule();
    });

    it('should create an instance', () => {
        expect(tagModule).toBeTruthy();
    });
});
