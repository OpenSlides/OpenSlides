import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignmentPollSlideComponent } from './assignment-poll-slide.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('AssignmentPollSlideComponent', () => {
    let component: AssignmentPollSlideComponent;
    let fixture: ComponentFixture<AssignmentPollSlideComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [AssignmentPollSlideComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AssignmentPollSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
