import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageSubmittersComponent } from './manage-submitters.component';
import { E2EImportsModule } from 'e2e-imports.module';
import { ViewChild, Component } from '@angular/core';

import { ViewMotion } from 'app/site/motions/models/view-motion';
import { Motion } from 'app/shared/models/motions/motion';

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

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [ManageSubmittersComponent, TestHostComponent]
        }).compileComponents();
    }));

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
