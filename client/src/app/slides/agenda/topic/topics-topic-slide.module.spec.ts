import { TopicsTopicSlideModule } from './topics-topic-slide.module';

describe('TopicsTopicSlideModule', () => {
    let topicsTopicSlideModule: TopicsTopicSlideModule;

    beforeEach(() => {
        topicsTopicSlideModule = new TopicsTopicSlideModule();
    });

    it('should create an instance', () => {
        expect(topicsTopicSlideModule).toBeTruthy();
    });
});
