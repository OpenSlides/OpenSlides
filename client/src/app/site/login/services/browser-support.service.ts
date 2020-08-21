import { Injectable } from '@angular/core';

import { DeviceDetectorService, DeviceInfo } from 'ngx-device-detector';

const SmallestSupportedBrowserVersion = {
    Chrome: 80,
    Safari: 13,
    Firefox: 78,
    Opera: 70,
    'MS-Edge': 80,
    'MS-Edge-Chromium': 80
};

const BrowserBlacklist = ['IE'];

export interface BrowserRecommendation {
    name: string;
    url: string;
}

@Injectable({
    providedIn: 'root'
})
export class BrowserSupportService {
    public readonly recommendedBrowsers: BrowserRecommendation[] = [
        {
            name: 'Google Chrome',
            url: 'https://www.google.com/chrome/'
        },
        {
            name: 'Mozilla Firefox',
            url: 'https://www.mozilla.org/firefox/'
        }
    ];

    public constructor(private deviceService: DeviceDetectorService) {}

    public getDeviceInfo(): DeviceInfo {
        return this.deviceService.getDeviceInfo();
    }

    public getSupportedVersion(info: DeviceInfo): number {
        return SmallestSupportedBrowserVersion[info.browser];
    }

    /**
     * Detect the browser version and forward to an error page if the browser was too old
     */
    public isBrowserSupported(): boolean {
        const deviceInfo = this.deviceService.getDeviceInfo();
        const browser = deviceInfo.browser;
        const version = parseInt(deviceInfo.browser_version, 10);

        if (BrowserBlacklist.includes(browser)) {
            return false;
        } else if (!SmallestSupportedBrowserVersion[browser]) {
            // if we don't know the browser, let's assume they are working
            return true;
        } else {
            return version >= this.getSupportedVersion(deviceInfo);
        }
    }
}
