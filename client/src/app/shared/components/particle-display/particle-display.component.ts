import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { auditTime } from 'rxjs/operators';
import { Container, SizeMode } from 'tsparticles';
import { Shape } from 'tsparticles/dist/Options/Classes/Particles/Shape/Shape';
import { IImageShape } from 'tsparticles/dist/Options/Interfaces/Particles/Shape/IImageShape';
import { Emitters } from 'tsparticles/dist/Plugins/Emitters/Emitters';

import { ApplauseService } from 'app/core/ui-services/applause.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { ElementSize } from 'app/shared/directives/resized.directive';
import { BaseViewComponentDirective } from 'app/site/base/base-view';

@Component({
    selector: 'os-particle-display',
    templateUrl: './particle-display.component.html',
    styleUrls: ['./particle-display.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ParticleDisplayComponent extends BaseViewComponentDirective {
    public resizeSubject = new Subject<ElementSize>();
    private resizeAuditTime = 200;

    private particleContainer: Container;

    public set particleImage(imageUrl: string) {
        this.setParticleImage(imageUrl);
    }

    public set particleLevel(level: number) {
        this.setParticleLevel(level);
    }

    private noAutomaticParticles = {
        value: 0
    };

    private slowBlinkingOpacity = {
        value: 0.8,
        animation: {
            enable: true,
            speed: 1,
            sync: false,
            minimumValue: 0.3
        },
        random: {
            enable: true,
            minimumValue: 0.8
        }
    };

    private imageOptions: IImageShape = {
        replace_color: false,
        replaceColor: false,
        src: '',
        width: 24,
        height: 24
    };

    private customImageShape = {
        type: 'image',
        image: this.imageOptions
    };

    private charShapeHearth = {
        type: 'char',
        options: {
            char: {
                fill: true,
                font: 'Verdana',
                weight: '200',
                style: '',
                value: ['❤']
            }
        }
    };

    private slightlyRandomSize: any = {
        value: 16,
        random: {
            enable: true,
            minimumValue: 10
        }
    };

    private moveUpOptions = {
        enable: true,
        direction: 'top',
        speed: 1.0,
        angle: {
            offset: 45,
            value: 90
        },
        gravity: {
            enable: true,
            maxSpeed: 1.5,
            acceleration: -3
        },
        outModes: {
            left: 'bounce',
            right: 'bounce',
            top: 'destroy'
        }
    };

    private slowRandomRotation = {
        value: 0,
        enable: true,
        direction: 'random',
        animation: {
            enable: true,
            speed: 9
        },
        random: {
            enable: true,
            minimumValue: 0
        }
    };

    private randomColor = {
        value: 'random'
    };

    private singleBottomEmitter = [
        {
            direction: 'top',
            rate: {
                quantity: 0,
                delay: 0.33
            },
            position: {
                x: 50,
                y: 100
            },
            size: {
                mode: SizeMode.percent,
                width: 100
            }
        }
    ];

    public particlesOptions = {
        fpsLimit: 30,
        particles: {
            number: this.noAutomaticParticles,
            opacity: this.slowBlinkingOpacity,
            rotate: this.slowRandomRotation,
            move: this.moveUpOptions,
            color: this.randomColor,
            shape: this.charShapeHearth,
            size: this.slightlyRandomSize
        },
        emitters: this.singleBottomEmitter,
        detectRetina: true
    };

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
            applauseService.applauseLevelObservable.subscribe(applause => {
                this.particleLevel = this.calcEmitterLevel(applause || 0);
            }),
            configService.get<string>('general_system_applause_particle_image').subscribe(particleImage => {
                this.particleImage = particleImage || undefined;
            })
        );
    }

    private setParticleImage(particleImage: string): void {
        if (particleImage) {
            this.imageOptions.src = particleImage;
            (this.particlesOptions.particles.shape as any) = this.customImageShape;
        } else {
            (this.particlesOptions.particles.shape as any) = this.charShapeHearth;
        }
        if (this.particleContainer) {
            this.particleContainer.options.particles.load(this.particlesOptions.particles as any);
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
            const emitters = this.particleContainer.plugins.get('emitters') as Emitters;
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
