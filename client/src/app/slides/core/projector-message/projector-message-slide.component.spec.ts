import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../e2e-imports.module';
import { ProjectorMessageSlideComponent } from './projector-message-slide.component';

describe('ProjectorMessageSlideComponent', () => {
    let component: ProjectorMessageSlideComponent;
    let fixture: ComponentFixture<ProjectorMessageSlideComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [ProjectorMessageSlideComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ProjectorMessageSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
