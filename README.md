# Alternate dispute resolution pathways tool

A resource discovery tool that asks the customer for their story and presents matching resources.
This tool is implemented as a pattern for content pages in the [Your rights, crime and the law][YRCL] franchise of Queensland Government.

## Background

At the most fundamental level the justice system is about resolving a dispute between two or more parties.

The justice system is traditionally viewed as complex, with a plethora of different ways individuals can engage the system to resolve their disputes. These options are not always clear for customers. This results in customers taking a pathway to resolution that could have otherwise been resolved in a less complex manner.

---

## Publishing a new service page

There are 2 pages: search form and results.
You may use a single HTML file for both, or use separate files to alter the static content and metadata.

### A note on search engine optimisation (SEO)

There is no server-side support for rendering the search result content into the page for search engines. SEO relies entirely on the static content embedded in the page.

- SWE template
- dataset (hosted on Queensland Government's [open data portal][data])
- views: form, results, noresults, error, noscript.

### Customising page content

Most content can be updated by editing the HTML directly, in either the page or handlebars templates (views, see below).
It is possible to update data in the data portal, including adding new fields and rendering those values in the templates.
Some minor sections cannot be customised without updating the script.

![Diagram of results page](/docs/page-results.png)

### Dependencies

- [SWE template][SWE]: integration with Queensland Government online channel including:
  - [jQuery][jquery]: DOM helper library
  - [purl][purl]: URL helper library
  - web hosting on www.qld.gov.au
  - analytics
  - feedback
  - share
- [history.js][history.js]: a polyfill for managing browser state with support for old IE
- [handlebars][handlebars]: a light-weight template library for creating views with data
- [DataTables][datatables]: jquery plugin for sorting, filtering and pagination of tables
- source dataset (published on [data.qld.gov.au][data]) and specified in the metadata
- custom script. The script for this tool is published on www under `/assets/law/dispute-pathways.js`

## Page structure

1. follow the standard SWE template page structure
2. load SWE form validation library (required for dynamic forms). Add the following custom script in the `<head>`:

   ```html
   <script>qg.swe.load.formValidation = true;</script>
   ```

3. metadata: specify the dataset in the 'source', example:

   ```html
   <meta name="DCTERMS.source" scheme="DCTERMS.URI" content="https://staging.data.qld.gov.au/dataset/dispute-resolution-datasets/resource/56ac21ba-3de3-421a-ac40-297713e37e9d" />
   ```

   ![Diagram of HTML source META tag](/docs/html-meta.png)

4. embed custom styles: if any custom styles are required for the UI, embed them in a `<style>` tag
5. add a container for the main view:

   ```html
   <div id="dispute-pathways-view" aria-live="polite"></div>
   ```
6. add view templates (see below)

   Templates must use the ID values specified in order for the script to locate them.

   ```html
   <script id="loading-template" type="text/x-handlebars-template"><!--#include virtual="template/loading.html"--></script>
   <script id="form-template" type="text/x-handlebars-template"><!--#include virtual="template/form.html"--></script>
   <script id="results-template" type="text/x-handlebars-template"><!--#include virtual="template/results.html"--></script>
   <script id="no-results-template" type="text/x-handlebars-template"><!--#include virtual="template/no-results.html"--></script>
   <script id="error-template" type="text/x-handlebars-template"><!--#include virtual="template/error.html"--></script>
   ```

   ![Diagram of HTML source views](/docs/html-content.png)

7. link to dependencies:

   ```html
   <script src="https://cdnjs.cloudflare.com/ajax/libs/history.js/1.8/bundled-uncompressed/html4+html5/jquery.history.js"></script>
   <script src="https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/3.0.3/handlebars.min.js"></script>
   <script src="https://cdnjs.cloudflare.com/ajax/libs/datatables/1.10.7/js/jquery.dataTables.min.js"></script>
   ```

   ![Diagram of HTML source footer](/docs/html-footer.png)

8. link to the pathway tool script:

   ```html
   <script src="/assets/law/dispute-pathways.js"></script>
   ```

## Views

'Views' are the different states displayed in the UI.
Views are generated by mixing model data (viewmodel) with a template.
The template framework used by this tool is [handlebars][handlebars].
Templates must be embedded in the page as custom scripts.
Recommended: use [server-side includes (SSI)][SSI] on the www.qld.gov.au environment and manage templates as separate files.

### Helpers

In addition to standard handlebars functionality, the following helpers are implemented for this tool:

| Helper name  | Purpose                           | Usage                                                                              |
|--------------|-----------------------------------|------------------------------------------------------------------------------------|
| `vowelSound` | Render `a` or `an` as appropriate | `{{ vowelSound story.have 'an' 'a' }}` -> `a dispute` OR `an issue`                |
| `pluralize`  | Render plurals                    | `{{ pluralize results.totalMatches 'option' 'options' }}` -> `option` OR `options` |
| `select`     | Selects correct option            | Wrap around `<option>` elements within a `<select>` control                        |

### Form

The form view should be created with a handlebars template in order to correctly select the right values in the form.
This handles history state as customers move back and forward between results and the form.

#### Viewmodel

```json
{
  "form": {
    "withOptions": [],
    "aboutOptions": []
  },
  "story": {
    "have": "dispute",
    "with": "a neighbour",
    "about": "fences",
    "have_dispute": true,
    "with_a_neighbour": true,
    "about_fences": true,
    "council": ""
  }
}
```

- `story` values are retrieved from the history state.
- `form` contains arrays of options to populate the select lists
- each item in the option arrays follows the simple format: `{ label: text, value: text }`
- `have` options are hardcoded in the view template in order to control the ranking
- additional boolean values in `story` are provided to assist with conditionals in handlebars templates. For example, if the URL contains `with=a neighbour"` then these 2 properties will be present: `{ "with": "a neighbour", "with_a_neighbour": true }`
- council value will be available if it was present in the URL.

![Diagram of form options for 'have' question](/docs/form-q1-have.png)
![Diagram of form options for 'with' question](/docs/form-q2-with.png)
![Diagram of form options for 'about' question](/docs/form-q3-about.png)

### Results

The results page retrieves all data from the dataset and constructs a viewmodel based on resources that match the search criteria.
Search criteria are defined in the URL query string in the format: `?have=dispute&with=a neighbour&about=fences`.
Customers are redirected to the form if any parameter values are missing or invalid.

Sample template: [results.html](dist/template/results.html)

#### Viewmodel

```json
{
  "results": {
    "assisted": [],
    "formal": [],
    "legislation": [],
    "self": [],
    "totalMatches": 0
  },
  "story": {
    "have": "dispute",
    "with": "a neighbour",
    "about": "fences",
    "have_dispute": true,
    "with_a_neighbour": true,
    "about_fences": true,
    "council": ""
  }
}
```

- `self`, `assisted` and `formal`: arrays of matching results grouped relevant to self, assisted or formal resolution. Results may be duplicated if relevant to more than one pathway.
- `legislation`: array of results that have a `documentType` of `legislation`. Legislation results are excluded from self, assisted and formal arrays.
- `totalMatches`: (integer) accurate count of the total number of results. Results that are repeated in more than one pathway are only counted once.
- `story` provides access to the customer input values (read from the URL)
- additional boolean values in `story` are provided to assist with conditionals in handlebars templates. For example, if the URL contains `with=a neighbour"` then these 2 properties will be present: `{ "with": "a neighbour", "with_a_neighbour": true }`
- The structure of each item in the result arrays mirrors the [CSV format](#csv-format)
  Review the [data.qld.gov.au][data] API documentation for more information.
- `with`, `about` and `pathways` values for each result are exploded like so: `{ "with": { "a neighbour": true, "the body corporate": true }}`.
  Each value (separated by semicolons) becomes a property with the value `true` recorded.
- council value will be available if it was present in the URL.

#### Legislation aside

This template is rendered in place when there are 1 or more matching results with a `documentType` of `legislation`.
Uses the `results` viewmodel described above (`story` property is not provided).

Sample template: [aside-legislation.html](dist/template/aside-legislation.html)

![Diagram of legislation aside HTML source](/docs/html-asides.png)

#### Loading

Will be rendered while data is being fetched, before the form, results or error template kicks in.
Will be processed by handlebars with an empty viewmodel object `{}`. it is rendered in place.

Sample template: [loading.html](dist/template/loading.html)

#### No results

Will be rendered when no data matches the search criteria.
Will be processed by handlebars using the same viewmodel as results (above), however the results arrays will all be empty.

Sample template: [no-results.html](dist/template/no-results.html)

#### Error

This template is used when there is an error accessing data via JSONP.
Static content only.
Will be processed by handlebars, but no viewmodel data is provided.

[Recommended content](dist/template/error.html) is bundled with the source code.

#### No script

This tool relies on javascript and will not function without it.
Customers with javascript disabled should see a useful message pointing them to existing resources.
[Recommended content](dist/template/noscript.html) is bundled with the source code.

## Source data

Data is to be hosted on [data.qld.gov.au][data] and will be loaded and cached in the browser via JSONP.

Please note: issues with the CSV format will break the application!!

It is **highly recommended** that a test page be setup and linked to a test dataset (preferably hosted on staging.qld.gov.au).
Changes to the CSV data should be manually tested before being published live.


### CSV format

[Sample CSV dataset](https://staging.data.qld.gov.au/dataset/dispute-resolution-datasets)

| Column       | Required    | Purpose                               | Notes                                                                                                        |
|--------------|-------------|---------------------------------------|--------------------------------------------------------------------------------------------------------------|
| have         | ignored     | No longer used.                       | Any value accepted                                                                                           |
| with         | required    | Used to match against search criteria | Any values accepted, separate with semicolons                                                                |
| about        | required    | Used to match against search criteria | Any values accepted, separate with semicolons                                                                |
| pathway      | required    | Used to group search results          | 1 or more of `Self resolution; Assisted resolution; Formal resolution` (separated by semicolons)             |
| url          | recommended | Used for search results               | Can be customised in results view template                                                                   |
| title        | recommended | Used for search results               | Can be customised in results view template                                                                   |
| description  | recommended | Used for search results               | Can be customised in results view template                                                                   |
| documentType | required    | Used to tag results for sorting       | Use a single value from [AGLS document](AGLS.document) scheme. `legislation` results are shown only an aside |
| format       | optional    | Indicate PDF/doc/other results        | Can be customised in results view template                                                                   |
| publisher    | optional    | Used to identify Council resources    | Any publisher containing the words 'Council', 'City' or 'Town' will be filtered from the results.            |
| comments     | optional    | Internal use only                     |                                                                                                              |

- Most columns may be renamed or ignored (changes must be reflected in the template)
- Additional columns may be added (and then used in templates)
- `with` and `about` columns must separate multiple values with a semicolon
- `pathways` column must used only the listed values

---

# Development environment

A build environment is provided to assist with development and testing of the script.
The build is implemented in [grunt][grunt] and includes tasks to check the javascript source (syntax checking and acceptance tests).
Some knowledge of front-end development workflow tools and command line is assumed.

### Requirements

- [grunt][grunt]: workflow tool (task runner)
- [node][node]: javascript platform
- [npm][npm]: node package manager (installs grunt task plugins)
- [phantomjs][phantomjs]: headless browser (for testing)
- [casperjs][casperjs]: scripting language for browser testing

### Getting started

- download and install [node][node] (includes npm)
- download and install [phantomjs][phantomjs]
- install grunt command line: `npm install -g grunt-cli`
- clone this git repository
- run `npm install` to install other dependencies (grunt tasks, casper, etc.)

### Making changes

- type `grunt` to run the build
- browse [http://localhost:9999/](http://localhost:9999/) to preview files in the browser
- update [acceptance tests](test/acceptance/) for new/changed features
- add new functionality to the custom script: [src/dispute-pathways.js](src/dispute-pathways.js)

### Publishing changes

- update the version in git
- liase with the Channel improvement team in the One-Stop-Shop strategy and implementation office (OSSSIO) to publish the script to www.qld.gov.au

[data]: https://data.qld.gov.au
[SWE]: https://github.com/qld-gov-au/swe_template
[YRCL]: http://www.qld.gov.au/law/
[datatables]: https://www.datatables.net/
[handlebars]: http://handlebarsjs.com/
[history.js]: https://github.com/browserstate/history.js/
[jquery]: https://jquery.com/
[purl]: https://github.com/allmarkedup/purl
[grunt]: http://gruntjs.com/
[node]: https://nodejs.org/
[npm]: https://www.npmjs.com/
[phantomjs]: http://phantomjs.org/
[casperjs]: http://casperjs.org/
[AGLS.document]: http://www.agls.gov.au/documents/agls-document/
[SSI]: https://en.wikipedia.org/wiki/Server_Side_Includes
