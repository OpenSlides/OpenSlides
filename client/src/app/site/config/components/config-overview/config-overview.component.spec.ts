import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ConfigOverviewComponent } from './config-overview.component';
import { E2EImportsModule } from '../../../../../e2e-imports.module';

describe('ConfigOverviewComponent', () => {
    let component: ConfigOverviewComponent;
    let fixture: ComponentFixture<ConfigOverviewComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [ConfigOverviewComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(ConfigOverviewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
