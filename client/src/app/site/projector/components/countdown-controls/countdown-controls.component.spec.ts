import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { CountdownControlsComponent } from './countdown-controls.component';

describe('CountdownControlsComponent', () => {
    let component: CountdownControlsComponent;
    let fixture: ComponentFixture<CountdownControlsComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [CountdownControlsComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(CountdownControlsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
