import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectorContainerComponent } from './projector-container.component';

describe('ProjectorContainerComponent', () => {
    let component: ProjectorContainerComponent;
    let fixture: ComponentFixture<ProjectorContainerComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ProjectorContainerComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ProjectorContainerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
