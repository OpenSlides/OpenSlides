import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AgendaCurrentListOfSpeakersOverlaySlideComponent } from './agenda-current-list-of-speakers-overlay-slide.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('AgendaCurrentListOfSpeakersOverlaySlideComponent', () => {
    let component: AgendaCurrentListOfSpeakersOverlaySlideComponent;
    let fixture: ComponentFixture<AgendaCurrentListOfSpeakersOverlaySlideComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [AgendaCurrentListOfSpeakersOverlaySlideComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AgendaCurrentListOfSpeakersOverlaySlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
