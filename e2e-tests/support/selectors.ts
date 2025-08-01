/**
 * Centralized selector configuration for OpenSlides E2E tests
 */

export const Selectors = {
    login: {
        usernameField: [
            'input[formcontrolname="username"]',
            'input[name="username"]',
            'input[type="text"][placeholder*="username" i]',
            '#username',
            'mat-form-field:has-text("Username") input',
            'input[autocomplete="username"]',
            '[data-cy="username-input"]'
        ],
        passwordField: [
            'input[formcontrolname="password"]',
            'input[name="password"]',
            'input[type="password"]',
            '#password',
            'mat-form-field:has-text("Password") input',
            'input[autocomplete="current-password"]',
            '[data-cy="password-input"]'
        ],
        loginButton: [
            'button[type="submit"]',
            'button:has-text("Login")',
            'button:has-text("Sign in")',
            'button[mat-raised-button]:has-text("Login")',
            '.login-button',
            '[data-cy="login-button"]'
        ],
        rememberMeCheckbox: [
            'mat-checkbox[formcontrolname="rememberMe"]',
            'input[type="checkbox"][name="remember"]',
            'label:has-text("Remember me") input[type="checkbox"]',
            '.remember-me-checkbox',
            '[data-cy="remember-me-checkbox"]'
        ],
        errorMessage: [
            '.error-message',
            '.alert-danger',
            'mat-error',
            '[role="alert"]',
            '.login-error',
            '[data-cy="login-error"]'
        ]
    },
    
    navigation: {
        userMenu: [
            'button:has-text("Administrator")',
            '.user-menu',
            '[aria-label*="user" i]',
            'button:has-text("admin")',
            '.account-button',
            'mat-toolbar button:last-child',
            '[data-cy="user-menu"]',
            '.mat-toolbar button.mat-mdc-menu-trigger' // Material menu trigger in toolbar
        ],
        logoutButton: [
            'button:has-text("Logout")',
            'button:has-text("Sign out")',
            'a:has-text("Logout")',
            '[data-cy="logout-button"]'
        ],
        mainMenu: [
            'mat-sidenav',
            '.main-menu',
            'os-main-menu',
            '[data-cy="main-menu"]'
        ]
    },
    
    meetings: {
        meetingCard: [
            '.meeting-card',
            'mat-card:has-text("Meeting")',
            '.meeting-item',
            '[data-cy="meeting-card"]'
        ],
        newMeetingButton: [
            'button:has-text("New meeting")',
            'button:has-text("Create meeting")',
            'button[mat-fab]',
            '.add-button',
            'button[aria-label*="add" i]',
            '[data-cy="new-meeting-button"]'
        ],
        meetingNameField: [
            'input[formcontrolname="name"]',
            'input[name="name"]',
            'input[placeholder*="meeting name" i]',
            'mat-form-field:has-text("Name") input',
            '[data-cy="meeting-name-input"]'
        ]
    },
    
    agenda: {
        newItemButton: [
            'button:has-text("New item")',
            'button:has-text("Add item")',
            'button:has-text("Create item")',
            '[data-cy="new-agenda-item"]'
        ],
        itemTitleField: [
            'input[formcontrolname="title"]',
            'input[name="title"]',
            'input[placeholder*="title" i]',
            'mat-form-field:has-text("Title") input',
            '[data-cy="agenda-title-input"]'
        ],
        speakerList: [
            '.speaker-list',
            'os-speaker-list',
            '[data-cy="speaker-list"]'
        ],
        addSpeakerButton: [
            'button:has-text("Add speaker")',
            'button:has-text("Add to list")',
            '[data-cy="add-speaker-button"]'
        ]
    },
    
    motions: {
        newMotionButton: [
            'button:has-text("New motion")',
            'button:has-text("Create motion")',
            '[data-cy="new-motion-button"]'
        ],
        motionTitleField: [
            'input[formcontrolname="title"]',
            'input[name="title"]',
            'input[placeholder*="motion title" i]',
            '[data-cy="motion-title-input"]'
        ],
        motionTextField: [
            'textarea[formcontrolname="text"]',
            'textarea[name="text"]',
            '.motion-text-editor textarea',
            '[data-cy="motion-text-input"]'
        ],
        submitButton: [
            'button[type="submit"]',
            'button:has-text("Save")',
            'button:has-text("Create")',
            'button:has-text("Submit")',
            '[data-cy="submit-button"]'
        ]
    },
    
    common: {
        saveButton: [
            'button:has-text("Save")',
            'button[type="submit"]',
            'button[mat-raised-button]:has-text("Save")',
            '[data-cy="save-button"]'
        ],
        cancelButton: [
            'button:has-text("Cancel")',
            'button[mat-button]:has-text("Cancel")',
            '[data-cy="cancel-button"]'
        ],
        deleteButton: [
            'button:has-text("Delete")',
            'button[color="warn"]:has-text("Delete")',
            '[data-cy="delete-button"]'
        ],
        confirmButton: [
            'button:has-text("Confirm")',
            'button:has-text("Yes")',
            'button[mat-raised-button]:has-text("Confirm")',
            '[data-cy="confirm-button"]'
        ],
        successMessage: [
            '.success-message',
            '.alert-success',
            'mat-snack-bar',
            '.notification-success',
            '[data-cy="success-message"]'
        ],
        loadingSpinner: [
            'mat-spinner',
            '.spinner',
            '.loading',
            '[data-cy="loading-spinner"]'
        ]
    }
};