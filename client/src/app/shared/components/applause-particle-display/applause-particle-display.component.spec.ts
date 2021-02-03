import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { ApplauseParticleDisplayComponent } from './applause-particle-display.component';

describe('ApplauseParticleDisplayComponent', () => {
    let component: ApplauseParticleDisplayComponent;
    let fixture: ComponentFixture<ApplauseParticleDisplayComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ApplauseParticleDisplayComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
