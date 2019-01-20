import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SlideContainerComponent } from './slide-container.component';
import { E2EImportsModule } from '../../../../../e2e-imports.module';
import { ProjectorModule } from '../../projector.module';

describe('SlideContainerComponent', () => {
    let component: SlideContainerComponent;
    let fixture: ComponentFixture<SlideContainerComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule, ProjectorModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SlideContainerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
