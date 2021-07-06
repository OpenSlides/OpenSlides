import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../../e2e-imports.module';
import { ProjectorListEntryComponent } from './projector-list-entry.component';
import { ProjectorModule } from '../../projector.module';

describe('ProjectorListEntryComponent', () => {
    let component: ProjectorListEntryComponent;
    let fixture: ComponentFixture<ProjectorListEntryComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule, ProjectorModule]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(ProjectorListEntryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
