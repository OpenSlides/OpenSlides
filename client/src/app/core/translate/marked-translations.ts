import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';

/**
 * Add strings here that require translations but have never been declared
 * in code nor views.
 *
 * I.e: words transmitted by the server
 *
 * @example
 * ```ts
 * _('my new sentence to translate that has not been anywhere');
 * ```
 */

// Core config strings
_('Presentation and assembly system');
_('Event name');
_(
    '<a href="http://www.openslides.org">OpenSlides</a> is a free web based presentation and assembly system for visualizing and controlling agenda, motions and elections of an assembly.'
);
_('General');
_('Event');
_('Short description of event');
_('Event date');
_('Event location');
_('Event organizer');
_('Front page title');
_('Welcome to OpenSlides');
_('Front page text');
_('[Space for your welcome text.]');
_('System');
_('Allow access for anonymous guest users');
_('Live conference');
_('Show live conference window');
_('Connect all users to live conference automatically');
_('Allow only current speakers and list of speakers managers to enter the live conference');
_('Server settings required to activate Jitsi Meet integration.');
_('Livestream url');
_('Remove URL to deactivate livestream. Check extra group permission to see livestream.');
_('Livestream poster image url');
_('Shows if livestream is not started. Recommended image format: 500x200px, PNG or JPG');
_('Enable virtual help desk room');
_('Shows a button with help icon to connect to an extra Jitsi conference room for technical audio/video tests.');
_('Number of next speakers automatically connecting to the live conference');
_('Live conference has to be active. Choose 0 to disable auto connect.');
_('Automatically open the microphone for new conference speakers');
_('Automatically open the web cam for new conference speakers');
_('Virtual applause');
_('Enable virtual applause');
_('Level indicator');
_('Particles');
_('Applause visualization');
_('Show applause amount');
_('Lowest applause amount');
_('Defines the minimum deflection which is required to recognize applause.');
_('Highest applause amount');
_('Defines the maximum deflection. Entering zero will use the amount of present participants instead.');
_('Applause interval in seconds');
_('Defines the time in which applause amounts are add up.');
_('Applause particle image URL');
_('Shows the given image as applause particle. Recommended image format: 24x24px, PNG, JPG or SVG');
_('Show this text on the login page');
_('OpenSlides Theme');
_('Export');
_('Separator used for all csv exports and examples');
_('Default encoding for all csv exports');
_('Page number alignment in PDF');
_('Left');
_('Center');
_('Right');
_('Standard font size in PDF');
_('Standard page size in PDF');

// Projector config strings
_('Projector');
_('Projector language');
_('Current browser language');
_('Predefined seconds of new countdowns');
_('Default projector');
_('Custom translations');
_('List of speakers overlay');
_('Projector logo');
_('Projector header image');
_('PDF header logo (left)');
_('PDF header logo (right)');
_('PDF footer logo (left)');
_('PDF footer logo (right)');
_('Web interface header logo');
_('PDF ballot paper logo');
_('Foreground color');
_('Background color');
_('Header background color');
_('Header font color');
_('Headline color');
_('Chyron background color');
_('Chyron font color');
_(`You can't delete the last projector.`);

// Agenda config strings
_('Enable numbering for agenda items');
_('Numbering prefix for agenda items');
_('This prefix will be set if you run the automatic agenda numbering.');
_('Add to agenda');
_('Always');
_('Never');
_('Ask, default yes');
_('Ask, default no');
_('Invalid input.');
_('Numeral system for agenda items');
_('Arabic');
_('Roman');
_('Begin of event');
_('Input format: DD.MM.YYYY HH:MM');
_('Show motion submitters in the agenda');
_('Hide internal items when projecting subitems');
_('Number of the next speakers to be shown on the projector');
_('Enter number of the next shown speakers. Choose -1 to show all next speakers.');
_('Number of last speakers to be shown on the projector');
_('List of speakers');
_('The list of speakers is closed.');
_('Show orange countdown in the last x seconds of speaking time');
_('Enter duration in seconds. Choose 0 to disable warning color.');
_('Hide the amount of speakers in subtitle of list of speakers slide');
_('Couple countdown with the list of speakers');
_('Enable points of order');
_('[Begin speech] starts the countdown, [End speech] stops the countdown.');
_('Only present participants can be added to the list of speakers');
_('Show hint »first speech« in the list of speakers management view');
_('List of speakers is initially closed');
_('Enable forspeech / counter speech');
_('Enable star icon to mark speaker (e.g. for contribution)');
_('Everyone can see the request of a point of order (instead of managers for list of speakers only)');
_('Default visibility for new agenda items (except topics)');
_('public');
_('internal');
_('hidden');
_('Public item');
_('Internal item');
_('Hidden item');
// agenda misc strings
_('Only main agenda items');
_('Topics');
_('Open requests to speak');

// ** Motions **
// config strings
// subgroup general
_('General');
_('Workflow of new motions');
_('Workflow of new statute amendments');
_('Workflow of new amendments');
_('Motion preamble');
_('The assembly may decide:');
_('Default line numbering');
_('disabled');
_('Line length');
_('The maximum number of characters per line. Relevant when line numbering is enabled. Min: 40');
_('Reason required for creating new motion');
_('Hide motion text on projector');
_('Hide reason on projector');
_('Hide recommendation on projector');
_('Hide referring motions');
_('Show meta information box below the title on projector');
_('Show the sequential number for a motion');
_('In motion list, motion detail and PDF.');
_('Stop submitting new motions by non-staff users');
_('Name of recommender');
_(
    'Will be displayed as label before selected recommendation. Use an empty value to disable the recommendation system.'
);
_('Name of recommender for statute amendments');
_('Will be displayed as label before selected recommendation in statute amendments.');
_('Default text version for change recommendations');
_('Sort motions by');
// subgroup Numbering
_('Numbered per category');
_('Serially numbered');
_('Set it manually');
_('Number of minimal digits for identifier');
_('Uses leading zeros to sort motions correctly by identifier.');
_('Allow blank in identifier');
_("Blank between prefix and number, e.g. 'A 001'.");
_('No motions were numbered');
// subgroup Amendments
_('Amendments');
_('Activate statute amendments');
_('Activate amendments');
_('Show amendments together with motions');
_('Amendments can change multiple paragraphs');
_('Prefix for the identifier for amendments');
_('The title of the motion is always applied.');
_('How to create new amendments');
_('Empty text field');
_('Edit the whole motion text');
_('Paragraph-based, Diff-enabled');
_('Allow amendments of amendments');
// subgroup Supporters
_('Supporters');
_('Number of (minimum) required supporters for a motion');
_('Choose 0 to disable the supporting system.');
_('Remove all supporters of a motion if a submitter edits his motion in early state');
// subgroup Voting and ballot papers
_('Voting and ballot papers');
_('Default voting type');
_('Default 100 % base of a voting result');
_('Yes/No/Abstain');
_('Yes/No');
_('All valid ballots');
_('All casted ballots');
_('Disabled (no percents)');
_('Required majority');
_('Default method to check whether a motion has reached the required majority.');
_('Simple majority');
_('Two-thirds majority');
_('Three-quarters majority');
_('Disabled');
_('Number of ballot papers (selection)');
_('Number of all delegates');
_('Number of all participants');
_('Use the following custom number');
_('Custom number of ballot papers');
// subgroup PDF export
_('PDF export');
_('Title for PDF documents of motions');
_('Preamble text for PDF documents of motions');
_('Show submitters and recommendation/state in table of contents');
_('Show checkbox to record decision');

// motion workflow 1
_('Simple Workflow');
_('submitted');
_('accepted');
_('Accept');
_('Acceptance');
_('rejected');
_('Reject');
_('Rejection');
_('not decided');
_('Do not decide');
_('No decision');
// motion workflow 2
_('Complex Workflow');
_('in progress');
_('published');
_('permitted');
_('Permit');
_('Permission');
_('accepted');
_('Accept');
_('Acceptance');
_('rejected');
_('Reject');
_('Rejection');
_('withdrawed');
_('Withdraw');
_('adjourned');
_('Adjourn');
_('Adjournment');
_('not concerned');
_('Do not concern');
_('No concernment');
_('refered to committee');
_('Refer to committee');
_('Referral to committee');
_('needs review');
_('Needs review');
_('rejected (not authorized)');
_('Reject (not authorized)');
_('Rejection (not authorized)');
// motion workflow manager
_('Recommendation label');
_('Allow support');
_('Allow create poll');
_('Allow submitter edit');
_('Do not set identifier');
_('Show state extension field');
_('Show recommendation extension field');
_('Show amendment in parent motion');
_('Restrictions');
_('Label color');
_('Next states');
_('grey');
_('red');
_('green');
_('lightblue');
_('yellow');
_('You cannot delete the first state of the workflow.');
_('You cannot delete the last workflow.');
// misc for motions
_('Amendment');
_('Statute amendment for');
_('Statute paragraphs');
_('Called');
_('Called with');
_('Recommendation');
_('Motion block');
_('The text field may not be blank.');
_('The reason field may not be blank.');

// ** Assignments **
// Assignment config strings
_('Elections');
// subgroup ballot
_('Default election method');
_('Default 100 % base of an election result');
_('All valid ballots');
_('All casted ballots');
_('Disabled (no percents)');
_('Default groups with voting rights');
_('Sort election results by amount of votes');
_('Put all candidates on the list of speakers');
// subgroup ballot papers
_('Ballot papers');
_('Number of ballot papers');
_('Number of all delegates');
_('Number of all participants');
_('Use the following custom number');
_('Custom number of ballot papers');
_('Required majority');
_('Default method to check whether a candidate has reached the required majority.');
_('Simple majority');
_('Two-thirds majority');
_('Three-quarters majority');
_('Disabled');
_('Title for PDF document (all elections)');
_('Preamble text for PDF document (all elections)');
// misc for assignments
_('Searching for candidates');
_('Finished');
_('In the election process');

// Voting strings
_('Motion votes');
_('Ballots');
_('You cannot delegate a vote to a user who has already delegated his vote.');
_('You cannot delegate a delegation of vote to another user (cascading not allowed).');
_('You cannot delegate a vote to yourself.');

// ** Users **
// permission strings (see models.py of each Django app)
// agenda
_('Can see agenda');
_('Can manage agenda');
_('Can see list of speakers');
_('Can manage list of speakers');
_('Can see internal items and time scheduling of agenda');
_('Can put oneself on the list of speakers');
// assignments
_('Can see elections');
_('Can nominate another participant');
_('Can nominate oneself');
_('Can manage elections');
_('Electronic voting is disabled. Only analog polls are allowed');
_('Anonymizing can only be done after finishing a poll.');
_('You can just anonymize named polls');
_('You cannot vote since your vote right is delegated.');
// core
_('Can see the projector');
_('Can manage the projector');
_('Can see the autopilot');
_('Can see the front page');
_('Can manage tags');
_('Can manage configuration');
_('Can manage logos and fonts');
_('Can see history');
_('Can see the live stream');
_('Can manage chat');
// mediafiles
_('Can see the list of files');
_('Can upload files');
_('Can manage files');
_('Can see hidden files');
_('A file with this title or filename already exists in this directory.');
_('The name contains invalid characters: "/"');
_('The directory does not exist');
// motions
_('Can see motions');
_('Can see motions in internal state');
_('Can create motions');
_('Can support motions');
_('Can manage motions');
_('Can see comments');
_('Can manage comments');
_('Can manage motion metadata');
_('Can create amendments');
_('Can manage motion polls');

// users
_('Can see names of users');
_('Can see extra data of users (e.g. email and comment)');
_('Can manage users');
_('Can change its own password');

// users config strings
_('General');
_('Sort name of participants by');
_('Enable participant presence view');
_('Activate vote weight');
_('Allow users to set themselves as present');
_('e.g. for online meetings');
_('Participants');
_('Given name');
_('Surname');
_('PDF');
_('Welcome to OpenSlides');
_('Title for access data and welcome PDF');
_('[Place for your welcome and help text.]');
_('Help text for access data and welcome PDF');
_('System URL');
_('Used for QRCode in PDF of access data.');
_('WLAN name (SSID)');
_('Used for WLAN QRCode in PDF of access data.');
_('WLAN password');
_('Used for WLAN QRCode in PDF of access data.');
_('WLAN encryption');
_('Used for WLAN QRCode in PDF of access data.');
_('WEP');
_('WPA/WPA2');
_('No encryption');
_('Email');
_('Sender name');
_('The sender address is defined in the OpenSlides server settings and should modified by administrator only.');
_('Reply address');
_('Email subject');
_('OpenSlides access data');
_('You can use {event_name} and {username} as placeholder.');
_('Email body');
_(
    'Dear {name},\n\nthis is your personal OpenSlides login:\n\n    {url}\n    username: {username}\n    password: {password}\n\nThis email was generated automatically.'
);
_('Use these placeholders: {name}, {event_name}, {url}, {username}, {password}. The url referrs to the system url.');
_(
    'Use <strong>admin</strong> and <strong>admin</strong> for your first login.<br>Please change your password to hide this message!'
);

// users misc
_('Username or password is not correct.');
_('Please login via your identity provider.');
_('Your account is not active.');
_('You are not authenticated.');
_('Cookies have to be enabled to use OpenSlides.');
_('Guest');
_('Participant');
_('No users with email {0} found.');
_('You can not delete yourself.');
_('You can not deactivate yourself.');

// default groups
_('Default');
_('Admin');
_('Delegates');
_('Staff');
_('Committees');

// history strings
_('Motion created');
_('Motion deleted');
_('Motion updated');
_('Submitters changed');
_('Supporters changed');
_('State set to {arg1}');
_('Recommendation set to {arg1}');
_('Vote created');
_('Vote updated');
_('Vote deleted');
_('Voting started');
_('Voting stopped');
_('Voting reset');
_('Voting anonymized');
_('Number set');
_('OpenSlides is temporarily reset to following timestamp');
_('Motion change recommendation created');
_('Motion change recommendation updated');
_('Motion change recommendation deleted');
_('Motion block set to');
_('Poll created');
_('Poll updated');
_('Poll deleted');
_('Comment {arg1} updated');

// core misc strings
_('items per page');
_('Tag');
_('Not allowed in demo mode');

// strings which are not extracted as translateable strings from client code
_('Foreground color');
_('Background color');
_('Header background color');
_('Header font color');
_('Headline color');
_('Chyron background color');
_('Chyron font color');
_('Show full text');
_('Hide more text');
_('Show password');
_('Hide password');
_('result');
_('results');
