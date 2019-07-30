import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignmentDetailComponent } from './assignment-detail.component';
import { AssignmentPollComponent } from '../assignment-poll/assignment-poll.component';
import { E2EImportsModule } from '../../../../../e2e-imports.module';

describe('AssignmentDetailComponent', () => {
    let component: AssignmentDetailComponent;
    let fixture: ComponentFixture<AssignmentDetailComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [AssignmentDetailComponent, AssignmentPollComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AssignmentDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
