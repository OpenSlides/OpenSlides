import { TopicSlideModule } from './topic-slide.module';

describe('TopicSlideModule', () => {
    let topicsTopicSlideModule: TopicSlideModule;

    beforeEach(() => {
        topicsTopicSlideModule = new TopicSlideModule();
    });

    it('should create an instance', () => {
        expect(topicsTopicSlideModule).toBeTruthy();
    });
});
