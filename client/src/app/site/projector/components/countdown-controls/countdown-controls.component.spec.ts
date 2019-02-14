import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CountdownControlsComponent } from './countdown-controls.component';
import { E2EImportsModule } from 'e2e-imports.module';

describe('CountdownControlsComponent', () => {
    let component: CountdownControlsComponent;
    let fixture: ComponentFixture<CountdownControlsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [CountdownControlsComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CountdownControlsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
