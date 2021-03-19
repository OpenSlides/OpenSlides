import { Component, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { auditTime } from 'rxjs/operators';
import { Container } from 'tsparticles';

import { ApplauseService } from 'app/core/ui-services/applause.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { ElementSize } from 'app/shared/directives/resized.directive';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { particleConfig, particleOptions } from './particle-options';

@Component({
    selector: 'os-applause-particle-display',
    templateUrl: './applause-particle-display.component.html',
    styleUrls: ['./applause-particle-display.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ApplauseParticleDisplayComponent extends BaseViewComponentDirective {
    public options = particleOptions;
    public resizeSubject = new Subject<ElementSize>();
    private resizeAuditTime = 200;
    private particleContainer: Container;

    public set particleImage(imageUrl: string) {
        this.setParticleImage(imageUrl);
    }

    public set particleLevel(level: number) {
        this.setParticleLevel(level);
    }

    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        configService: ConfigService,
        private applauseService: ApplauseService
    ) {
        super(title, translate, matSnackBar);
        this.subscriptions.push(
            this.resizeSubject.pipe(auditTime(this.resizeAuditTime)).subscribe(size => {
                this.updateParticleContainer(size);
            }),
            applauseService.applauseLevelObservable.subscribe(applauseLevel => {
                this.particleLevel = this.calcEmitterLevel(applauseLevel || 0);
            }),
            configService.get<string>('general_system_applause_particle_image').subscribe(particleImage => {
                this.particleImage = particleImage || undefined;
            })
        );
    }

    private setParticleImage(particleImage: string): void {
        if (particleImage) {
            particleConfig.customImageShape.image.src = particleImage;
            (this.options.particles.shape as any) = particleConfig.customImageShape;
        } else {
            (this.options.particles.shape as any) = particleConfig.charShapeHearth;
        }
        if (this.particleContainer) {
            this.particleContainer.options.particles.load(this.options.particles as any);
            this.refresh();
        }
    }

    private calcEmitterLevel(applauseLevel: number): number {
        if (!applauseLevel) {
            return 0;
        }
        let emitterLevel = this.applauseService.getApplauseQuote(applauseLevel);
        emitterLevel = Math.ceil(emitterLevel * 10);
        return emitterLevel;
    }

    private setParticleLevel(level: number): void {
        if (this.particleContainer) {
            const emitters = this.particleContainer.plugins.get('emitters') as any;
            // TODO: Use `Emitters` instead of any.
            if (emitters) {
                emitters.array[0].emitterOptions.rate.quantity = level;
            }
        }
    }

    private updateParticleContainer(size: ElementSize): void {
        if (!size.height || !size.width) {
            this.stop();
        } else {
            this.refresh();
        }
    }

    private stop(): void {
        this.particleContainer?.stop();
    }

    private refresh(): void {
        this.particleContainer?.refresh();
    }

    public particlesLoaded(container: Container): void {
        this.particleContainer = container;
        this.refresh();
    }
}
