import { AgendaCurrentListOfSpeakersSlideModule } from './agenda-current-list-of-speakers-slide.module';

describe('AgendaCurrentListOfSpeakersModule', () => {
    let agendaCurrentListOfSpeakersSlideModule: AgendaCurrentListOfSpeakersSlideModule;

    beforeEach(() => {
        agendaCurrentListOfSpeakersSlideModule = new AgendaCurrentListOfSpeakersSlideModule();
    });

    it('should create an instance', () => {
        expect(agendaCurrentListOfSpeakersSlideModule).toBeTruthy();
    });
});
