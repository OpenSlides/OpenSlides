import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectorComponent } from './projector.component';
import { E2EImportsModule } from '../../../e2e-imports.module';

describe('ProjectorComponent', () => {
    let component: ProjectorComponent;
    let fixture: ComponentFixture<ProjectorComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [ProjectorComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ProjectorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
