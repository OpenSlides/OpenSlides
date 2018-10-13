import { MediafilesModule } from './mediafiles.module';

describe('MediafilesModule', () => {
    let mediafilesModule: MediafilesModule;

    beforeEach(() => {
        mediafilesModule = new MediafilesModule();
    });

    it('should create an instance', () => {
        expect(mediafilesModule).toBeTruthy();
    });
});
