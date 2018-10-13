import { ProjectorContainerModule } from './projector-container.module';

describe('ProjectorContainerModule', () => {
    let projectorContainerModule: ProjectorContainerModule;

    beforeEach(() => {
        projectorContainerModule = new ProjectorContainerModule();
    });

    it('should create an instance', () => {
        expect(projectorContainerModule).toBeTruthy();
    });
});
