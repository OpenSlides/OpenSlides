import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSlideComponent } from './user-slide.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('UserSlideComponent', () => {
    let component: UserSlideComponent;
    let fixture: ComponentFixture<UserSlideComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [UserSlideComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(UserSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
