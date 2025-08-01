# OpenSlides Organization Design Documentation

## Overview
The Organization Design page provides theme and visual customization management at the organization level, allowing administrators to create, manage, and apply visual themes across all meetings and interfaces within the organization.

## URL Routes
- Organization Design: `/organizations/:orgId/design`

## Page Layout
```
┌─────────────────────────────────────────────────┐
│  Design                            [+]          │
├─────────────────────────────────────────────────┤
│  3 of 3                           [🔍 Search__] │
├─────────────────────────────────────────────────┤
│  Theme List                                     │
│  ┌─────────────────────────────────────────────┐│
│  │ OpenSlides Blue                       [✓] [⋮]││
│  │ [🔵🔷🟠] Color Palette Preview        │
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ OpenSlides Red                        [ ] [⋮]││
│  │ [🔴🔷🟢] Color Palette Preview        │
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ OpenSlides Green                      [ ] [⋮]││
│  │ [🟢🟦🟪] Color Palette Preview        │
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

## Theme Management Interface

### Header Controls
- **Create Theme Button (+)**: Add new custom themes
- **Result Counter**: Shows current results ("3 of 3")
- **Search Field**: Real-time theme search and filtering

### Theme Card Display
Each theme is displayed as a card containing:
- **Theme Name**: "OpenSlides Blue", "OpenSlides Red", "OpenSlides Green"
- **Color Palette Preview**: Visual representation of primary colors
- **Selection Checkbox**: Choose active theme (✓ for selected, ☐ for unselected)
- **Actions Menu (⋮)**: Individual theme management options

## Default Themes

### OpenSlides Blue (Default)
- **Primary Colors**: Blue palette with complementary colors
- **Status**: Currently selected (✓)
- **Usage**: Default organization theme
- **Color Scheme**: Blue primary, gray secondary, orange accent

### OpenSlides Red
- **Primary Colors**: Red palette with blue and green accents
- **Status**: Available but not selected
- **Usage**: Alternative theme option
- **Color Scheme**: Red primary, blue secondary, green accent

### OpenSlides Green  
- **Primary Colors**: Green palette with blue and purple accents
- **Status**: Available but not selected
- **Usage**: Alternative theme option
- **Color Scheme**: Green primary, blue secondary, purple accent

## Theme Creation and Customization

### Create New Theme Dialog
```
┌─────────────────────────────────────────────────┐
│  Create custom theme                    [x]     │
├─────────────────────────────────────────────────┤
│  Theme name *                                   │
│  [Corporate Theme________________]              │
│                                                 │
│  Base theme                                     │
│  [OpenSlides Blue ▼]                            │
│                                                 │
│  Color Customization                            │
│  ┌─────────────────────────────────────────────┐│
│  │ Primary Color                               ││
│  │ [🔵] #2196F3                               ││
│  │                                             ││
│  │ Secondary Color                             ││
│  │ [⚫] #424242                               ││
│  │                                             ││
│  │ Accent Color                                ││
│  │ [🟠] #FF9800                               ││
│  │                                             ││
│  │ Background Color                            ││
│  │ [⚪] #FFFFFF                               ││
│  │                                             ││
│  │ Text Color                                  ││
│  │ [⚫] #212121                               ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Logo and Branding                              │
│  Organization logo: [Choose file...]            │
│  Favicon: [Choose file...]                      │
│                                                 │
│  Preview                                        │
│  [Live preview of theme applied to interface]   │
│                                                 │
│  [Cancel]                        [Create]       │
└─────────────────────────────────────────────────┘
```

### Edit Theme Dialog
```
┌─────────────────────────────────────────────────┐
│  Edit theme                             [x]     │
├─────────────────────────────────────────────────┤
│  Theme name                                     │
│  [OpenSlides Blue________________]              │
│                                                 │
│  Theme type                                     │
│  ● System theme (read-only)                     │
│  ○ Custom theme                                 │
│                                                 │
│  Color Palette                                  │
│  [Read-only color display for system themes]    │
│                                                 │
│  Usage Statistics                               │
│  Used in: 2 meetings, organization default      │
│  Created: System theme                          │
│  Last modified: N/A                             │
│                                                 │
│  Actions                                        │
│  [Duplicate Theme] [Export Theme]               │
│                                                 │
│  [Close]                                        │
└─────────────────────────────────────────────────┘
```

## Color Management

### Color Palette System
- **Primary Color**: Main brand color for headers, buttons, and key elements
- **Secondary Color**: Supporting color for backgrounds and secondary elements
- **Accent Color**: Highlight color for calls-to-action and emphasis
- **Background Color**: Main page background
- **Text Color**: Primary text color for readability
- **Success Color**: Green for positive actions and confirmations
- **Warning Color**: Yellow/orange for cautionary messages
- **Error Color**: Red for errors and destructive actions
- **Info Color**: Blue for informational messages

### Color Picker Interface
```
┌─────────────────────────────────────────────────┐
│  Color picker                           [x]     │
├─────────────────────────────────────────────────┤
│  Color selection                                │
│  ┌─────────────────────────────────────────────┐│
│  │         Color Wheel                         ││
│  │    ┌───────────────────────────┐           ││
│  │    │         🎨               │           ││
│  │    │    Color picker area      │           ││
│  │    └───────────────────────────┘           ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Hex value: [#2196F3_______]                    │
│  RGB: R[33] G[150] B[243]                       │
│  HSL: H[207] S[90] L[54]                        │
│                                                 │
│  Preset colors                                  │
│  [🔴][🟠][🟡][🟢][🔵][🟣][⚫][⚪]            │
│                                                 │
│  Recent colors                                  │
│  [Previous color selections]                    │
│                                                 │
│  [Cancel]                        [Apply]        │
└─────────────────────────────────────────────────┘
```

## Theme Application and Management

### Theme Selection
- **Radio Button Selection**: Choose one active theme at a time
- **Live Preview**: See changes applied in real-time
- **Rollback Option**: Revert to previous theme if needed
- **Confirmation Dialog**: Confirm theme changes before applying

### Theme Scope
- **Organization Default**: Applied to all meetings without custom themes
- **Meeting Override**: Individual meetings can override organization theme
- **Public Interface**: Applied to login page and public areas
- **Email Templates**: Theme colors used in email notifications

### Theme Operations
Available from theme card menu (⋮):
- **Edit Theme**: Modify custom themes (system themes read-only)
- **Duplicate Theme**: Create copy for customization
- **Apply Theme**: Set as active organization theme
- **Export Theme**: Download theme configuration
- **Delete Theme**: Remove custom themes (system themes protected)
- **Preview Theme**: Test theme without applying

## Advanced Customization

### Logo and Branding
```
┌─────────────────────────────────────────────────┐
│  Branding settings                      [x]     │
├─────────────────────────────────────────────────┤
│  Organization logo                              │
│  Current: [logo-preview.png]                    │
│  [Change logo...]                               │
│                                                 │
│  Logo specifications:                           │
│  • Format: PNG, JPG, SVG                       │
│  • Max size: 2MB                                │
│  • Recommended: 200x50px                       │
│                                                 │
│  Favicon                                        │
│  Current: [favicon-preview.ico]                 │
│  [Change favicon...]                            │
│                                                 │
│  Favicon specifications:                        │
│  • Format: ICO, PNG                             │
│  • Size: 16x16, 32x32, 48x48px                 │
│                                                 │
│  Application name                               │
│  [OpenSlides________________]                   │
│                                                 │
│  [Save changes]                                 │
└─────────────────────────────────────────────────┘
```

### Typography Settings
- **Font Family**: Choose from web-safe fonts or custom fonts
- **Font Sizes**: Configure heading and body text sizes
- **Font Weights**: Set bold, normal, and light weight options
- **Line Height**: Adjust text line spacing for readability
- **Letter Spacing**: Fine-tune character spacing

### Layout Options
- **Header Style**: Configure top navigation appearance
- **Sidebar Style**: Customize side navigation design
- **Content Spacing**: Adjust padding and margins
- **Border Radius**: Set corner rounding for interface elements
- **Shadow Effects**: Configure drop shadows and elevation

## Theme Import/Export

### Export Theme
```
┌─────────────────────────────────────────────────┐
│  Export theme                           [x]     │
├─────────────────────────────────────────────────┤
│  Theme: OpenSlides Blue                         │
│                                                 │
│  Export format:                                 │
│  ● JSON (OpenSlides format)                     │
│  ○ CSS (stylesheet)                             │
│  ○ SCSS (variables)                             │
│                                                 │
│  Include:                                       │
│  ☑ Color definitions                           │
│  ☑ Typography settings                         │
│  ☑ Layout options                              │
│  ☐ Logo files                                  │
│                                                 │
│  File name: [openslides-blue-theme.json]       │
│                                                 │
│  [Cancel]                      [Download]       │
└─────────────────────────────────────────────────┘
```

### Import Theme
```
┌─────────────────────────────────────────────────┐
│  Import theme                           [x]     │
├─────────────────────────────────────────────────┤
│  Theme file                                     │
│  [Choose file...] No file selected             │
│                                                 │
│  Supported formats:                             │
│  • JSON (OpenSlides theme)                      │
│  • CSS (color extraction)                       │
│                                                 │
│  Import options:                                │
│  ☑ Preserve existing themes                    │
│  ☐ Replace if theme name exists                │
│  ☑ Validate colors and settings                │
│                                                 │
│  Theme name (override):                         │
│  [________________]                             │
│                                                 │
│  [Cancel]                        [Import]       │
└─────────────────────────────────────────────────┘
```

## Integration Features

### Meeting Integration
- **Default Theme**: Organization theme applied to new meetings
- **Theme Override**: Meetings can use custom themes
- **Inheritance**: Meetings inherit organization branding
- **Consistency**: Maintain visual consistency across meetings

### Email Integration
- **Themed Emails**: Apply colors to email templates
- **Logo Integration**: Include organization logo in emails
- **Consistent Branding**: Match email design to interface theme
- **Responsive Design**: Ensure themes work in email clients

### External Integration
- **API Access**: Programmatic theme management
- **Webhook Support**: Theme change notifications
- **CSS Export**: Use themes in external applications
- **Brand Guidelines**: Export brand assets and guidelines

## Data Models

### Theme Model
```typescript
{
  id: number;
  name: string;
  organization_id: number;
  is_system_theme: boolean;
  is_active: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  typography?: {
    font_family: string;
    font_sizes: object;
    font_weights: object;
  };
  branding?: {
    logo_url?: string;
    favicon_url?: string;
    application_name?: string;
  };
  created_at: number;
  updated_at: number;
  usage_count: number;
}
```

### Theme Configuration Model
```typescript
{
  theme_id: number;
  css_variables: object;
  component_styles: object;
  media_queries: object;
  custom_properties: object;
}
```

## Permissions and Access Control

### Design Permissions
- `organization.can_see_themes`: View available themes
- `organization.can_manage_themes`: Create, edit, delete custom themes
- `organization.can_apply_themes`: Change active organization theme
- `organization.can_manage_branding`: Upload logos and configure branding

### Permission Levels
- **Organization Admin**: Full theme management access
- **Design Manager**: Create and edit custom themes
- **Theme Selector**: Apply existing themes
- **Viewer**: View current theme only

## E2E Test Selectors

### Theme List
- Theme container: `.theme-list`
- Theme card: `.theme-card`
- Theme name: `.theme-name`
- Color palette: `.color-palette`
- Theme checkbox: `.theme-selection`
- Theme actions: `.theme-actions`

### Theme Management
- Create button: `button[matTooltip="Create theme"]`
- Theme selector: `mat-radio-button.theme-option`
- Color picker: `.color-picker`
- Logo upload: `input[type="file"].logo-upload`
- Apply button: `button.apply-theme`

### Color Controls
- Color input: `input[type="color"]`
- Hex input: `input.hex-value`
- Color presets: `.color-presets`
- Color wheel: `.color-wheel`

## Keyboard Shortcuts
- `Ctrl+N`: Create new theme
- `Ctrl+F`: Focus search field
- `Enter`: Apply selected theme
- `Escape`: Cancel current operation
- `Tab`: Navigate between color inputs
- `Ctrl+S`: Save theme changes

## Accessibility Features
- **High Contrast Support**: Themes compatible with high contrast modes
- **Color Blindness**: Alternative indicators beyond color
- **Keyboard Navigation**: Full keyboard control of theme interface
- **Screen Reader Support**: ARIA labels for all controls
- **Focus Management**: Clear focus indicators
- **Semantic HTML**: Proper form and button markup

## Performance Features
- **CSS Variables**: Efficient theme switching using CSS custom properties
- **Lazy Loading**: Load theme previews on demand
- **Caching**: Cache theme configurations for fast switching
- **Optimized Assets**: Compress and optimize theme images
- **Progressive Enhancement**: Core functionality without JavaScript