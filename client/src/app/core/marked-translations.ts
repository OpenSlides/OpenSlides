import { _ } from 'app/core/translate/translation-marker';

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

// Agenda config strings
_('Enable numbering for agenda items');
_('Numbering prefix for agenda items');
_('This prefix will be set if you run the automatic agenda numbering.');
_('Agenda');
_('Invalid input.');
_('Numeral system for agenda items');
_('Arabic');
_('Roman');
_('Begin of event');
_('Input format: DD.MM.YYYY HH:MM');
_('Hide internal items when projecting subitems');
_('Number of last speakers to be shown on the projector');
_('List of speakers');
_('Show orange countdown in the last x seconds of speaking time');
_('Enter duration in seconds. Choose 0 to disable warning color.');
_('Couple countdown with the list of speakers');
_('[Begin speech] starts the countdown, [End speech] stops the countdown.');
_('Only present participants can be added to the list of speakers'), _('Agenda visibility');
_('Default visibility for new agenda items (except topics)');
_('public');
_('internal');
_('hidden');
_('Public item');
_('Internal item');
_('Hidden item');
// agenda misc strings
_('Only main agenda items');

// Motions config strings
// subgroup general
_('General');
_('Workflow of new motions');
_('Workflow of new statute amendments');
_('Numbered per category');
_('Serially numbered');
_('Set it manually');
_('Motion preamble');
_('The assembly may decide:');
_('Default line numbering');
_('disabled');
_('Line length');
_('The maximum number of characters per line. Relevant when line numbering is enabled. Min: 40');
_('Reason required for creating new motion');
_('Hide reason on projector');
_('Hide meta information box on projector');
_('Hide recommendation on projector');
_('Stop submitting new motions by non-staff users');
_('Allow to disable versioning');
_('Name of recommender');
_(
    'Will be displayed as label before selected recommendation. Use an empty value to disable the recommendation system.'
);
_('Name of recommender for statute amendments');
_('Will be displayed as label before selected recommendation in statute amendments.');
_('Default text version for change recommendations');
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
// subgroup Supporters
_('Supporters');
_('Number of (minimum) required supporters for a motion');
_('Choose 0 to disable the supporting system.');
_('Remove all supporters of a motion if a submitter edits his motion in early state');
// subgroup Voting and ballot papers
_('Voting and ballot papers');
_('The 100 % base of a voting result consists of');
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
_('Show submitters and recommendation in table of contents');
_('Sort categories by');
_('Sort motions by');
_('Include the sequential number in PDF and DOCX');
// misc motion strings
_('Amendment');
_('Statute amendment for');

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
// misc for motions
_('Called');
_('Called with');
_('Recommendation');
_('Motion block');
_('The text field may not be blank.');
_('The reason field may not be blank.');

// Assignment config strings
_('Election method');
_('Automatic assign of method');
_('Always one option per candidate');
_('Always Yes-No-Abstain per candidate');
_('Always Yes/No per candidate');
_('Elections');
_('Ballot and ballot papers');
_('The 100-%-base of an election result consists of');
_(
    'For Yes/No/Abstain per candidate and Yes/No per candidate the 100-%-base depends on the election method: If there is only one option per candidate, the sum of all votes of all candidates is 100 %. Otherwise for each candidate the sum of all votes is 100 %.'
);
_('Yes/No/Abstain per candidate');
_('Yes/No per candidate');
_('All valid ballots');
_('All casted ballots');
_('Disabled (no percents)');
_('Number of ballot papers (selection)');
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
_('Put all candidates on the list of speakers');
_('Title for PDF document (all elections)');
_('Preamble text for PDF document (all elections)');
// motion workflow
_('Recommendation label');
_('Allow support');
_('Allow create poll');
_('Allow submitter edit');
_('Set identifier');
_('Show state extension field');
_('Show recommendation extension field');
_('Show amendment in parent motion');
_('Restrictions');
_('Label color');
_('Next states');

// other translations
_('Searching for candidates');
_('Voting');
_('Finished');

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
// core
_('Can see the projector');
_('Can manage the projector');
_('Can see the front page');
_('Can manage tags');
_('Can manage configuration');
_('Can manage logos and fonts');
_('Can see history');
// mediafiles
_('Can see the list of files');
_('Can upload files');
_('Can manage files');
_('Can see hidden files');
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
// users
_('Can see names of users');
_('Can see extra data of users (e.g. present and comment)');
_('Can manage users');
_('Can change its own password');

// users config strings
_('General');
_('Sort name of participants by');
_('Enable participant presence view');
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
_('Email sender');
_('Email subject');
_('Your login for {event_name}');
_('You can use {event_name} and {username} as placeholder.');
_('Email body');
_(
    'Dear {name},\n\nthis is your OpenSlides login for the event {event_name}:\n\n    {url}\n    username: {username}\n    password: {password}\n\nThis email was generated automatically.'
);
_('Use these placeholders: {name}, {event_name}, {url}, {username}, {password}. The url referrs to the system url.');
_(
    'Use <strong>admin</strong> and <strong>admin</strong> for your first login.<br>Please change your password to hide this message!'
);

// users misc
_('Username or password is not correct.');
_('Guest');

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
_('Number set');
_('OpenSlides is temporarily reset to following timestamp');
_('Motion change recommendation created');
_('Motion change recommendation updated');
_('Motion change recommendation deleted');

// core misc strings
_('items per page');
