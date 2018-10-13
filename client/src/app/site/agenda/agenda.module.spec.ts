import { AgendaModule } from './agenda.module';

describe('AgendaModule', () => {
    let agendaModule: AgendaModule;

    beforeEach(() => {
        agendaModule = new AgendaModule();
    });

    it('should create an instance', () => {
        expect(agendaModule).toBeTruthy();
    });
});
