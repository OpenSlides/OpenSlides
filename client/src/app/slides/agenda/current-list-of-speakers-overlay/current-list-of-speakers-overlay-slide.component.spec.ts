import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonListOfSpeakersSlideModule } from '../common/common-list-of-speakers-slide.module';
import { CurrentListOfSpeakersOverlaySlideComponent } from './current-list-of-speakers-overlay-slide.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('CurrentListOfSpeakersOverlaySlideComponent', () => {
    let component: CurrentListOfSpeakersOverlaySlideComponent;
    let fixture: ComponentFixture<CurrentListOfSpeakersOverlaySlideComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule, CommonListOfSpeakersSlideModule],
                declarations: [CurrentListOfSpeakersOverlaySlideComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(CurrentListOfSpeakersOverlaySlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
