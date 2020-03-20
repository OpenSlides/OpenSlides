import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { AssignmentPollDetailContentComponent } from './assignment-poll-detail-content.component';

describe('AssignmentPollDetailContentComponent', () => {
    let component: AssignmentPollDetailContentComponent;
    let fixture: ComponentFixture<AssignmentPollDetailContentComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AssignmentPollDetailContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
