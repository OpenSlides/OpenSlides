import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectorDetailComponent } from './projector-detail.component';
import { ProjectorModule } from '../../projector.module';
import { E2EImportsModule } from 'e2e-imports.module';

describe('ProjectorDetailComponent', () => {
    let component: ProjectorDetailComponent;
    let fixture: ComponentFixture<ProjectorDetailComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule, ProjectorModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ProjectorDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
