import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { UserStatisticsComponent } from './user-statistics.component';

describe('UserStatisticsComponent', () => {
    let component: UserStatisticsComponent;
    let fixture: ComponentFixture<UserStatisticsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(UserStatisticsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
