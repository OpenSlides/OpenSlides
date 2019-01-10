import { ProjectorModule } from './projector.module';

describe('ProjectorModule', () => {
    let projectorModule: ProjectorModule;

    beforeEach(() => {
        projectorModule = new ProjectorModule();
    });

    it('should create an instance', () => {
        expect(projectorModule).toBeTruthy();
    });
});
