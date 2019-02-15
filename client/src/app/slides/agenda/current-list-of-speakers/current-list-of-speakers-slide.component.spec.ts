import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentListOfSpeakersSlideComponent } from './current-list-of-speakers-slide.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('CurrentListOfSpeakersSlideComponent', () => {
    let component: CurrentListOfSpeakersSlideComponent;
    let fixture: ComponentFixture<CurrentListOfSpeakersSlideComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [CurrentListOfSpeakersSlideComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CurrentListOfSpeakersSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
