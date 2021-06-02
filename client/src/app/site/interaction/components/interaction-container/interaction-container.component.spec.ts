import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { InteractionContainerComponent } from './interaction-container.component';

describe('InteractionContainerComponent', () => {
    let component: InteractionContainerComponent;
    let fixture: ComponentFixture<InteractionContainerComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [InteractionContainerComponent],
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(InteractionContainerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
