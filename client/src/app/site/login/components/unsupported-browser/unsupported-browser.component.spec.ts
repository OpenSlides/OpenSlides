import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { UnsupportedBrowserComponent } from './unsupported-browser.component';

describe('UnsupportedBrowserComponent', () => {
    let component: UnsupportedBrowserComponent;
    let fixture: ComponentFixture<UnsupportedBrowserComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [UnsupportedBrowserComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(UnsupportedBrowserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
