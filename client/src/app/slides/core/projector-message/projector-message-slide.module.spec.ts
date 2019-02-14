import { ProjectorMessageSlideModule } from './projector-message-slide.module';

describe('ProjectormessageSlideModule', () => {
    let projectorMessageSlideModule: ProjectorMessageSlideModule;

    beforeEach(() => {
        projectorMessageSlideModule = new ProjectorMessageSlideModule();
    });

    it('should create an instance', () => {
        expect(projectorMessageSlideModule).toBeTruthy();
    });
});
