import { SizeMode } from 'tsparticles';

export const particleConfig = {
    noAutomaticParticles: {
        value: 0
    },
    slowBlinkingOpacity: {
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
    },
    customImageShape: {
        type: 'image',
        image: {
            replace_color: false,
            replaceColor: false,
            src: '',
            width: 24,
            height: 24
        }
    },
    charShapeHearth: {
        type: 'char',
        options: {
            char: {
                fill: true,
                value: ['❤'],
                /**
                 * has to be here due to a bug
                 * TRACK: https://github.com/matteobruni/tsparticles/issues/1087
                 * ---
                 */
                font: 'Verdana',
                weight: '200',
                style: ''
                /** --- */
            }
        }
    },
    slightlyRandomSize: {
        value: 16,
        random: {
            enable: true,
            minimumValue: 10
        }
    },
    moveUpOptions: {
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
    },
    slowRandomRotation: {
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
    },
    randomColor: {
        value: 'random'
    },
    singleBottomEmitter: [
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
    ]
};

export const particleOptions = {
    fpsLimit: 30,
    particles: {
        number: particleConfig.noAutomaticParticles,
        opacity: particleConfig.slowBlinkingOpacity,
        rotate: particleConfig.slowRandomRotation,
        move: particleConfig.moveUpOptions,
        color: particleConfig.randomColor,
        shape: particleConfig.charShapeHearth,
        size: particleConfig.slightlyRandomSize
    },
    emitters: particleConfig.singleBottomEmitter,
    detectRetina: true
};
