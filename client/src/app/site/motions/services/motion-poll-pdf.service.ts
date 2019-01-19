import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'app/core/ui-services/config.service';
import { MotionPoll } from 'app/shared/models/motions/motion-poll';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { PdfDocumentService } from 'app/core/ui-services/pdf-document.service';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';

type BallotCountChoices = 'NUMBER_OF_DELEGATES' | 'NUMBER_OF_ALL_PARTICIPANTS' | 'CUSTOM_NUMBER';

/**
 * Creates a pdf for a motion poll. Takes as input any motionPoll
 * Provides the public method `printBallots(motionPoll)` which should be convenient to use.
 *
 * @example
 * ```ts
 * this.MotionPollPdfService.printBallos(this.poll);
 * ```
 */
@Injectable({
    providedIn: 'root'
})
export class MotionPollPdfService {
    /**
     * The method to determine the number of ballots to print. Value is
     * decided in configuration service as `motions_pdf_ballot_papers_selection`.
     * Options are:
     *
     * - NUMBER_OF_DELEGATES Amount of users belonging to the predefined 'delegates' group (group id 2)
     * - NUMBER_OF_ALL_PARTICIPANTS The amount of all registered users
     * - CUSTOM_NUMBER a given number of ballots (see {@link ballotCustomCount})
     */
    private ballotCountSelection: BallotCountChoices;

    /**
     * An arbitrary number of ballots to print, if {@link ballotCountSection} is set
     * to CUSTOM_NUMBER. Value is fetched from the configuration value `motions_pdf_ballot_papers_number`
     */
    private ballotCustomCount: number;

    /**
     * The event name (as set in config `general_event_name`)
     */
    private eventName: string;

    /**
     * The url of the logo to be printed (as set in config `logo_pdf_ballot_paper`)
     */
    private logo: string;

    /**
     * Constructor. Subscribes to configuration values
     *
     * @param translate handle translations
     * @param motionRepo get parent motions
     * @param configService Read config variables
     * @param userRepo User repository for counting amount of ballots needed
     * @param pdfService the pdf document creation service
     */
    public constructor(
        private translate: TranslateService,
        private motionRepo: MotionRepositoryService,
        private configService: ConfigService,
        private userRepo: UserRepositoryService,
        private pdfService: PdfDocumentService
    ) {
        this.configService
            .get<number>('motions_pdf_ballot_papers_number')
            .subscribe(count => (this.ballotCustomCount = count));
        this.configService
            .get<BallotCountChoices>('motions_pdf_ballot_papers_selection')
            .subscribe(selection => (this.ballotCountSelection = selection));
        this.configService.get<string>('general_event_name').subscribe(name => (this.eventName = name));
        this.configService.get<{ path?: string }>('logo_pdf_ballot_paper').subscribe(url => {
            if (url && url.path) {
                if (url.path.indexOf('/') === 0) {
                    url.path = url.path.substr(1); // remove prepending slash
                }
                this.logo = url.path;
            }
        });
    }

    /**
     * Triggers a pdf creation for this poll's ballots.
     * There will be 8 ballots per page.
     * Each ballot will contain:
     * - the event name and logo
     * - a first, bold line with a title. Defaults to the label Motion, the identifier,
     *   and the current number of polls for this motion (if more than one)
     * - a subtitle. A second, short (two lines, 90 characters) clarification for
     *   the ballot. Defaults to the beginning of the motion's title
     * - the options 'yes', 'no', 'abstain' translated to the client's language.
     *
     * @param motionPoll: The poll this ballot refers to
     * @param title (optional) a different title
     * @param subtitle (optional) a different subtitle
     */
    public printBallots(motionPoll: MotionPoll, title?: string, subtitle?: string): void {
        const motion = this.motionRepo.getViewModel(motionPoll.motion_id);
        const fileName = `${this.translate.instant('Motion')} - ${motion.identifier} - ${this.translate.instant(
            'ballot-paper'
        )}`;
        if (!title) {
            title = `${this.translate.instant('Motion')} - ${motion.identifier}`;
            if (motion.motion.polls.length > 1) {
                title += ` (${this.translate.instant('Vote')} ${motion.motion.polls.length})`;
            }
        }
        if (!subtitle) {
            subtitle = motion.title;
        }
        if (subtitle.length > 90) {
            subtitle = subtitle.substring(0, 90) + '...';
        }
        this.pdfService.downloadWithBallotPaper(this.getContent(title, subtitle), fileName, this.logo);
    }

    /**
     * @returns the amount of ballots that are to be printed, depending n the
     * config settings
     */
    private getBallotCount(): number {
        switch (this.ballotCountSelection) {
            case 'NUMBER_OF_ALL_PARTICIPANTS':
                return this.userRepo.getViewModelList().length;
            case 'NUMBER_OF_DELEGATES':
                return this.userRepo.getViewModelList().filter(user => user.groups_id && user.groups_id.includes(2))
                    .length;
            case 'CUSTOM_NUMBER':
                return this.ballotCustomCount;
        }
    }

    /**
     * Creates an entry for an option (a label with a circle)
     *
     * @returns pdfMake definitions
     */
    private createBallotOption(decision: string): object {
        const BallotCircleDimensions = { yDistance: 6, size: 8 };
        return {
            margin: [40 + BallotCircleDimensions.size, 10, 0, 0],
            columns: [
                {
                    width: 15,
                    canvas: this.drawCircle(BallotCircleDimensions.yDistance, BallotCircleDimensions.size)
                },
                {
                    width: 'auto',
                    text: decision
                }
            ]
        };
    }

    /**
     * Create a createPdf definition for the correct amount of ballots
     * with 8 ballots per page
     *
     * @param title: first, bold line for the ballot.
     * @param subtitle: second  line for the ballot.
     * @returns an array of content objects defining pdfMake instructions
     */
    private getContent(title: string, subtitle: string): Array<object> {
        const content = [];
        const amount = this.getBallotCount();
        const fullpages = Math.floor(amount / 8);
        let partialpageEntries = amount % 8;

        for (let i = 0; i < fullpages; i++) {
            content.push({
                table: {
                    headerRows: 1,
                    widths: ['*', '*'],
                    body: [
                        [this.createBallot(title, subtitle), this.createBallot(title, subtitle)],
                        [this.createBallot(title, subtitle), this.createBallot(title, subtitle)],
                        [this.createBallot(title, subtitle), this.createBallot(title, subtitle)],
                        [this.createBallot(title, subtitle), this.createBallot(title, subtitle)]
                    ],
                    pageBreak: 'after'
                },
                // layout: '{{ballot-placeholder-to-insert-functions-here}}',
                rowsperpage: 4
            });
        }
        if (partialpageEntries) {
            const partialPageBody = [];
            while (partialpageEntries > 1) {
                partialPageBody.push([this.createBallot(title, subtitle), this.createBallot(title, subtitle)]);
                partialpageEntries -= 2;
            }
            if (partialpageEntries === 1) {
                partialPageBody.push([this.createBallot(title, subtitle), '']);
            }
            content.push({
                table: {
                    headerRows: 1,
                    widths: ['50%', '50%'],
                    body: partialPageBody
                },
                // layout: '{{ballot-placeholder-to-insert-functions-here}}',
                rowsperpage: 4
            });
        }
        return content;
    }

    /**
     * get a pdfMake header definition with the event name and an optional logo
     *
     * @returns pdfMake definitions
     */
    private getHeader(): object {
        const columns: object[] = [];
        columns.push({
            text: this.eventName,
            fontSize: 8,
            alignment: 'left',
            width: '60%'
        });

        if (this.logo) {
            columns.push({
                image: this.logo,
                fit: [90, 25],
                alignment: 'right',
                width: '40%'
            });
        }
        return {
            color: '#555',
            fontSize: 10,
            margin: [30, 10, 10, -10], // [left, top, right, bottom]
            columns: columns,
            columnGap: 5
        };
    }

    /**
     * Creates one ballot in it's position on the page. Note that creating once
     * and then pasting the result several times does not work
     *
     * @param title The identifier of the motion
     * @param subtitle The actual motion title
     */
    private createBallot(title: string, subtitle: string): any {
        const sheetend = 40;
        return {
            stack: [
                this.getHeader(),
                {
                    text: title,
                    style: 'title'
                },
                {
                    text: subtitle,
                    style: 'description'
                },
                this.createBallotOption(this.translate.instant('Yes')),
                this.createBallotOption(this.translate.instant('No')),
                this.createBallotOption(this.translate.instant('Abstain'))
            ],
            margin: [0, 0, 0, sheetend]
        };
    }

    /**
     * Helper to draw a circle on its position on the ballot paper
     *
     * @param y vertical offset
     * @param size the size of the circle
     * @returns an array containing one circle definition for pdfMake
     */
    private drawCircle(y: number, size: number): Array<object> {
        return [
            {
                type: 'ellipse',
                x: 0,
                y: y,
                lineColor: 'black',
                r1: size,
                r2: size
            }
        ];
    }
}
