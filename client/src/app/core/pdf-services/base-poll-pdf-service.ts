import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { ViewAssignmentPoll } from 'app/site/assignments/models/view-assignment-poll';

/**
 * Server side ballot choice definitions.
 * Server-defined methods to determine the number of ballots to print
 * Options are:
 * - NUMBER_OF_DELEGATES Amount of users belonging to the predefined 'delegates' group (group id 2)
 * - NUMBER_OF_ALL_PARTICIPANTS The amount of all registered users
 * - CUSTOM_NUMBER a given number of ballots (see {@link ballotCustomCount})
 */
export type BallotCountChoices = 'NUMBER_OF_DELEGATES' | 'NUMBER_OF_ALL_PARTICIPANTS' | 'CUSTOM_NUMBER';

/**
 * Workaround data definitions. The implementation for the different model's classes might have different needs,
 * so some data might not be required.
 *
 */
export interface AbstractPollData {
    title: string;
    subtitle?: string;
    sheetend: number; // should reflect the vertical size of one ballot on the paper
    poll?: ViewAssignmentPoll; // TODO ugly workaround because assignment poll needs the poll on ballot level
}

export abstract class PollPdfService {
    /**
     * Definition of method to decide which amount of ballots to print. The implementations
     * are expected to fetch this information from the configuration service
     * @see BallotCountChoices
     */
    protected ballotCountSelection: BallotCountChoices;

    /**
     * An arbitrary number of ballots to print, if {@link ballotCountSelection} is set
     * to CUSTOM_NUMBER. Value is expected to be fetched from the configuration`
     */
    protected ballotCustomCount: number;

    /**
     * The event name (as set in config `general_event_name`)
     */
    protected eventName: string;

    /**
     * The url of the logo to be printed (as set in config `logo_pdf_ballot_paper`)
     */
    protected logo: string;

    /**
     * Contructor. Subscribes to the logo path and event name
     * @param configService Configzuration
     * @param userRepo user Repository for determining the number of ballots
     */
    public constructor(protected configService: ConfigService, protected userRepo: UserRepositoryService) {
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
     * Get the amount of ballots to be printed
     *
     * @returns the amount of ballots, depending on the config settings
     */
    protected getBallotCount(): number {
        switch (this.ballotCountSelection) {
            case 'NUMBER_OF_ALL_PARTICIPANTS':
                return this.userRepo.getViewModelList().length;
            case 'NUMBER_OF_DELEGATES':
                return this.userRepo.getViewModelList().filter(user => user.groups_id && user.groups_id.includes(2))
                    .length;
            case 'CUSTOM_NUMBER':
                return this.ballotCustomCount;
            default:
                throw new Error('Amount of ballots cannot be computed');
        }
    }

    /**
     * Creates an entry for an option (a label with a circle)
     *
     * @returns pdfMake definitions
     */
    protected createBallotOption(decision: string): { margin: number[]; columns: object[] } {
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
     * Helper to draw a circle on its position on the ballot paper
     *
     * @param y vertical offset
     * @param size the size of the circle
     * @returns an array containing one circle definition for pdfMake
     */
    private drawCircle(y: number, size: number): object[] {
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

    /**
     * Abstract function for creating a single ballot with header and all options
     *
     * @param data AbstractPollData
     * @returns pdfmake definitions
     */
    protected abstract createBallot(data: AbstractPollData): object;

    /**
     * Create a createPdf definition for the correct amount of ballots
     *
     * @param rowsPerPage (precalculated) value of pair of ballots fitting on one page.
     * A value too high might result in phantom items split onto several pages
     * @param data predefined data to be used
     * @returns pdfmake definitions
     */
    protected getPages(rowsPerPage: number, data: AbstractPollData): object {
        const amount = this.getBallotCount();
        const fullpages = Math.floor(amount / (rowsPerPage * 2));
        let partialpageEntries = amount % (rowsPerPage * 2);
        const content: object[] = [];
        for (let i = 0; i < fullpages; i++) {
            const body = [];
            for (let j = 0; j < rowsPerPage; j++) {
                body.push([this.createBallot(data), this.createBallot(data)]);
            }
            content.push({
                table: {
                    headerRows: 1,
                    widths: ['*', '*'],
                    body: body,
                    pageBreak: 'after'
                },
                rowsperpage: rowsPerPage
            });
        }
        if (partialpageEntries) {
            const partialPageBody = [];
            while (partialpageEntries > 1) {
                partialPageBody.push([this.createBallot(data), this.createBallot(data)]);
                partialpageEntries -= 2;
            }
            if (partialpageEntries === 1) {
                partialPageBody.push([this.createBallot(data), '']);
            }
            content.push({
                table: {
                    headerRows: 1,
                    widths: ['50%', '50%'],
                    body: partialPageBody
                },
                rowsperpage: rowsPerPage
            });
        }
        return content;
    }

    /**
     * get a pdfMake header definition with the event name and an optional logo
     *
     * @returns pdfMake definitions
     */
    protected getHeader(): object {
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
     * create a pdfmake definition for a title entry
     *
     * @param title
     * @returns pdfmake definition
     */
    protected getTitle(title: string): object {
        return {
            text: title,
            style: 'title'
        };
    }

    /**
     * create a pdfmake definition for a subtitle entry
     *
     * @param subtitle
     * @returns pdfmake definition
     */
    protected getSubtitle(subtitle: string): object {
        return {
            text: subtitle,
            style: 'description'
        };
    }
}
