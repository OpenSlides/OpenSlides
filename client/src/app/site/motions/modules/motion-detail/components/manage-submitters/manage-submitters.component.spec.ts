import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { Motion } from 'app/shared/models/motions/motion';
import { ViewMotion } from 'app/site/motions/models/view-motion';
import { ManageSubmittersComponent } from './manage-submitters.component';

describe('ManageSubmittersComponent', () => {
    @Component({
        selector: 'os-host-component',
        template: '<os-manage-submitters></os-manage-submitters>'
    })
    class TestHostComponent {
        @ViewChild(ManageSubmittersComponent, { static: true })
        public manageSubmitterComponent: ManageSubmittersComponent;
    }

    let hostComponent: TestHostComponent;
    let hostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [ManageSubmittersComponent, TestHostComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        hostFixture = TestBed.createComponent(TestHostComponent);
        hostComponent = hostFixture.componentInstance;
    });

    it('should create', () => {
        const motion = new ViewMotion(new Motion());
        hostComponent.manageSubmitterComponent.motion = motion;

        hostFixture.detectChanges();
        expect(hostComponent.manageSubmitterComponent).toBeTruthy();
    });
});
