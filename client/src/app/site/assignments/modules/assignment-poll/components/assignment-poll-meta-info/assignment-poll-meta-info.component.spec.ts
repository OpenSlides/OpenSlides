import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { AssignmentPollMetaInfoComponent } from './assignment-poll-meta-info.component';

describe('AssignmentPollMetaInfoComponent', () => {
    let component: AssignmentPollMetaInfoComponent;
    let fixture: ComponentFixture<AssignmentPollMetaInfoComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [AssignmentPollMetaInfoComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AssignmentPollMetaInfoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
