import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AgendaCurrentListOfSpeakersSlideComponent } from './agenda-current-list-of-speakers-slide.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('CoreCountdownSlideComponent', () => {
    let component: AgendaCurrentListOfSpeakersSlideComponent;
    let fixture: ComponentFixture<AgendaCurrentListOfSpeakersSlideComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [AgendaCurrentListOfSpeakersSlideComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AgendaCurrentListOfSpeakersSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
