import { Injectable } from '@angular/core';

import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';

import { OverlayService } from './overlay.service';

const givePermsMessage = _('Please allow OpenSlides to access your microphone and/or camera');
const accessDeniedMessage = _('Media access is denied');
const noMicMessage = _('Your device has no microphone');
@Injectable({
    providedIn: 'root'
})
export class UserMediaPermService {
    private hasAudioDevice: boolean;
    private hasVideoDevice: boolean;

    public constructor(private translate: TranslateService, private overlayService: OverlayService) {}

    public async requestMediaAccess(): Promise<void> {
        await this.detectAvailableDevices();

        if (!this.hasAudioDevice) {
            throw new Error(noMicMessage);
        }
        const hasMediaAccess: PermissionState | null = await this.detectPermStatus();
        if (!hasMediaAccess || hasMediaAccess === 'prompt') {
            await this.tryMediaAccess();
        } else if (hasMediaAccess === 'denied') {
            this.throwPermError();
        }
    }

    /**
     * `navigator.permissions.query` does only work in chrome
     * This function detects if this method works at all.
     * If it does not work, we try to access the media anyways without
     * detecting the set permission beforehand.
     * The negative result would be, that the user sees the
     * overlay for a very short time.
     * This cannot be avoided, but rather solves itself if more browsers
     * start to support the given media query
     */
    private async detectPermStatus(): Promise<PermissionState | null> {
        try {
            const micPermStatus = await navigator.permissions.query({ name: 'microphone' });
            const camPermStatus = await navigator.permissions.query({ name: 'camera' });

            if (!this.hasVideoDevice || micPermStatus.state === camPermStatus.state) {
                return micPermStatus.state;
            } else if (micPermStatus.state === 'denied' || camPermStatus.state === 'denied') {
                return 'denied';
            } else {
                return null;
            }
        } catch (e) {
            return null;
        }
    }

    private async detectAvailableDevices(): Promise<void> {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        this.hasAudioDevice = !!mediaDevices.find(device => device.kind === 'audioinput');
        this.hasVideoDevice = !!mediaDevices.find(device => device.kind === 'videoinput');
    }

    private async tryMediaAccess(): Promise<void> {
        this.showAwaitPermInfo();
        try {
            const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
                audio: this.hasAudioDevice,
                video: this.hasVideoDevice
            });
            this.hideAwaitPermInfo();

            if (stream) {
                stream.getTracks().forEach(track => {
                    track.stop();
                });
            }
        } catch (e) {
            if (e instanceof DOMException) {
                if (e.message === 'Permission denied') {
                    this.throwPermError();
                }
            } else {
                this.throwPermError(e);
            }
        }
    }

    private throwPermError(error: Error = new Error(accessDeniedMessage)): void {
        this.hideAwaitPermInfo();
        console.error(error);
        throw new Error(this.translate.instant(error.message));
    }

    /**
     * Show:
     * Please allow OpenSlides to use your microphone
     */
    private showAwaitPermInfo(): void {
        this.overlayService.showSpinner(this.translate.instant(givePermsMessage), true);
    }

    private hideAwaitPermInfo(): void {
        this.overlayService.hideSpinner();
    }
}
