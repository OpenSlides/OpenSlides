# OpenSlides

[![tests-stable](https://github.com/peb-adr/OpenSlides/actions/workflows/test-integration-stable.yml/badge.svg)](https://github.com/peb-adr/OpenSlides/actions/workflows/test-integration-stable.yml)
[![build-stable](https://github.com/peb-adr/OpenSlides/actions/workflows/build-images-stable.yml/badge.svg)](https://github.com/peb-adr/OpenSlides/actions/workflows/build-images-stable.yml)
[![tests-staging](https://github.com/peb-adr/OpenSlides/actions/workflows/test-integration-staging.yml/badge.svg)](https://github.com/peb-adr/OpenSlides/actions/workflows/test-integration-staging.yml)
[![build-staging](https://github.com/peb-adr/OpenSlides/actions/workflows/build-images-staging.yml/badge.svg)](https://github.com/peb-adr/OpenSlides/actions/workflows/build-images-staging.yml)

## What is OpenSlides?

OpenSlides is a free, web based presentation and assembly system for
managing and projecting agenda, motions and elections of an assembly. See
https://openslides.com for more information.


## Installation

To set up an OpenSlides 4 instance, please follow our [install
instructions](INSTALL.md).


## Migration from OpenSlides 3.4

The structure of the application as well as the usage changed heavily with OpenSlides 4. The new
structure supports multiple meetings, grouped into committees, in one organization. A previous
instance of OpenSlides 3 is now a single meeting in OpenSlides 4. This is why there is no automatic
migration path.

However, you have the possiblity to export your meeting from OpenSlides 3 and import it in
OpenSlides 4:
- In your __OpenSlides 3__ instance, go to *Settings*, click on the three dots in the top right-hand
  corner and click *Export to OpenSlides4*. A JSON file will be downloaded which contains all your
  instance's data.
- In your __OpenSlides 4__ instance, create a committee to hold your old meeting by selecting
  *Committees* on the left side, clicking the *+* button, filling out the relevant form data and
  clicking *Save* (or choose an existing meeting by selecting the respective list entry). In the
  committee's detail view, click on the three dots in the top right-hand corner and then *Import
  meeting*. Select the previously downloaded file and click *Upload*. You should now see your
  OpenSlides 3 instance as an entry in the meeting list.


## Development

For further information about developing OpenSlides, refer to [the development
readme](DEVELOPMENT.md).


## License and authors

OpenSlides is Free/Libre Open Source Software (FLOSS), and distributed under the
MIT License, see [LICENSE file](LICENSE). The authors of OpenSlides are
mentioned in the [AUTHORS file](AUTHORS).
