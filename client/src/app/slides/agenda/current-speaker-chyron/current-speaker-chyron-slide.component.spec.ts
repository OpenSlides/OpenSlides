import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentSpeakerChyronSlideComponent } from './current-speaker-chyron-slide.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('CurrentSpeakerChyronSlideComponent', () => {
    let component: CurrentSpeakerChyronSlideComponent;
    let fixture: ComponentFixture<CurrentSpeakerChyronSlideComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [CurrentSpeakerChyronSlideComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CurrentSpeakerChyronSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
