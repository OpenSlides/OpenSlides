import { TopicsModule } from './topics.module';

describe('TopicsModule', () => {
    let topicsModule: TopicsModule;

    beforeEach(() => {
        topicsModule = new TopicsModule();
    });

    it('should create an instance', () => {
        expect(topicsModule).toBeTruthy();
    });
});
