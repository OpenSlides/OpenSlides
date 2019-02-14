import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CountdownListComponent } from './countdown-list.component';
import { E2EImportsModule } from 'e2e-imports.module';
import { CountdownControlsComponent } from '../countdown-controls/countdown-controls.component';

describe('CountdownListComponent', () => {
    let component: CountdownListComponent;
    let fixture: ComponentFixture<CountdownListComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [CountdownListComponent, CountdownControlsComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CountdownListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
