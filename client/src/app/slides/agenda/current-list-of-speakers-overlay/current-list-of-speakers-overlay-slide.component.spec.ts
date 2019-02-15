import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentListOfSpeakersOverlaySlideComponent } from './current-list-of-speakers-overlay-slide.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('CurrentListOfSpeakersOverlaySlideComponent', () => {
    let component: CurrentListOfSpeakersOverlaySlideComponent;
    let fixture: ComponentFixture<CurrentListOfSpeakersOverlaySlideComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [CurrentListOfSpeakersOverlaySlideComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CurrentListOfSpeakersOverlaySlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
