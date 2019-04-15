import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../../e2e-imports.module';
import { ProjectorModule } from '../../projector.module';
import { ProjectorListEntryComponent } from './projector-list-entry.component';

describe('ProjectorListEntryComponent', () => {
    let component: ProjectorListEntryComponent;
    let fixture: ComponentFixture<ProjectorListEntryComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule, ProjectorModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ProjectorListEntryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
