import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersUserSlideComponent } from './users-user-slide.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('UsersUserSlideComponent', () => {
    let component: UsersUserSlideComponent;
    let fixture: ComponentFixture<UsersUserSlideComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [UsersUserSlideComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(UsersUserSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
