import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CountUsersComponent } from './count-users.component';
import { E2EImportsModule } from '../../../../../e2e-imports.module';

describe('CountUsersComponent', () => {
    let component: CountUsersComponent;
    let fixture: ComponentFixture<CountUsersComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [CountUsersComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(CountUsersComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
