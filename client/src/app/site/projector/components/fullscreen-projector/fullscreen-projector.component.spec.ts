import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FullscreenProjectorComponent } from './fullscreen-projector.component';
import { E2EImportsModule } from 'e2e-imports.module';
import { ProjectorModule } from '../../projector.module';

describe('FullscreenProjectorComponent', () => {
    let component: FullscreenProjectorComponent;
    let fixture: ComponentFixture<FullscreenProjectorComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule, ProjectorModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(FullscreenProjectorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
