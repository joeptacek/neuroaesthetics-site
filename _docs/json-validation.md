# MOVED FROM CHATLAB-SITE (OUTDATED!)

# JSON validation

for objects in `people.json`, `news.json`, and `publications.json`

## general notes

- for all strings containing double quotes, JSON requires escaping via `\"`

## objects in `people` array

key | required | type | format | value(s)
--- | --- | --- | --- | ---
first_name | yes | string ||
middle_last_name | yes | string ||
suffix | no | string ||
position | yes | string ||
alum | yes | boolean ||
photo | yes unless `alum` is `true` | string | absolute file path [chatlab-site] |
bio | yes unless `alum` is `true` | string ||
category | yes | string || lab_director, staff, postdoctoral_researchers, student_researchers, visiting_researchers
staff_category | yes if `category` is `staff` | string || patient_coordinators, lab_managers
student_category | yes if `category` is `student_researchers` | string || graduate_students, medical_students, post_baccalaureate_students, undergraduate_students, hs_students, undergraduate_or_hs_students
cv | no | string | absolute file path [chatlab-site] or external URL |
email | no | string | email address |
website | no | string | external URL |
twitter | no | string | external URL |
instagram | no | string | external URL |
flickr | no | string | external URL |
github | no | string | external URL |

### notes and conventions for objects in `people` array

#### `category`

- use singular; also maybe merge `staff_category` and `student_category` into `category`

## objects in `news` array

key | required | type | format | value(s)
--- | --- | --- | --- | ---
title | yes | string ||
source | yes | string ||
source_short | no | string ||
sub_source | no | string ||
date | yes | string | YYYY-MM-DD |
url | yes unless `archived` is `true` | string ||
category | yes | string || print, audio, video
archived | yes | boolean ||
site_pcfn | yes | boolean ||
site_chatlab | yes | boolean ||
reprints | no | array || info about `reprints` array below
highlights_data | no | object ||

### objects in `reprints` array

key | required | type | format | value(s)
--- | --- | --- | --- | ---
source | yes | string ||
url | yes | string | external URL |

### `highlights_data` object

key | required | type | format | value(s)
--- | --- | --- | --- | ---
highlights_rank | yes | number ||
highlights_photo | yes | string | absolute file path [neuroaesthetics-site] |

### notes and conventions for objects in `news` array

#### `title`

- use title case

#### `sub_source`

- deprecated in templates?

#### `highlights_rank`

- higher rank appears first (easier for prioritizing new additions to highlights)

## objects in `publications` array

key | required | type | format | value(s)
--- | --- | --- | --- | ---
work_authors | yes | string ||
work_year | yes | integer ||
work_title | yes | string ||
work_publication_format | yes | string || article_in_journal, article_in_edited_work
work_doi | no | string ||
work_post_date | yes | string | YYYY-MM-DD |
work_post_date_fake | yes | integer ||
pdf | no | string | absolute file path [chatlab-site] |
category | yes | string || language_and_space, event_representation, neuroaesthetics, neuroethics, miscellaneous
review | yes | boolean ||
link | yes | boolen ||

### if `work_publication_format` is `article_in_journal`

key | required | type | format | value(s)
--- | --- | --- | --- | ---
journal_title | yes | string ||
journal_advance | yes | boolean ||
journal_preprint | yes | boolean ||
journal_vol | yes unless `journal_advance` or `journal_preprint` is `true` | integer ||
journal_issue | no | integer ||
journal_pages_start | yes unless `journal_advance` or `journal_preprint` is `true` | integer (or maybe not, e.g., WIREs might use alphanumeric article numbers in the page field ||
journal_pages_stop | yes unless `journal_advance` or `journal_preprint` is `true` | integer (or maybe not, e.g., WIREs might use alphanumeric article numbers in the page field ||

### if `work_publication_format` is `article_in_edited_work`

key | required | type | format | value(s)
--- | --- | --- | --- | ---
edited_work_type | yes | string || book, conference
edited_work_title | yes | string ||
edited_work_pages_start | yes | integer ||
edited_work_pages_stop | yes | integer ||
edited_work_editors | yes | string ||
edited_work_location | yes | string ||
edited_work_publisher | yes | string ||

### if `review` is `true`

key | required | type | format | value(s)
--- | --- | --- | --- | ---
review_type | yes | string || review, conmmentary
reviewed_work_type | yes | string ||
reviewed_work_title | yes | string ||
reviewed_work_author | yes | string ||

### if `link` is `true`

key | required | type | format | value(s)
--- | --- | --- | --- | ---
link_name | yes | string ||
link_url | yes | absolute file path [chatlab-site] ||

### notes and conventions for objects in `publications` array

#### `work_authors`

- for each author: last name + comma + first initial + middle initial(s)
- period after each initial, space between consecutive initials
- if multiple authors, comma after each (EVEN if only two authors), including oxford comma
- use ampersand & before final author (not "and")
- hyphenated names become hyphenated initials, no space (e.g., if middle name is `Jean-Baptise` use `J.-B.`)

#### `work_year`

- four-digit year. update this (and filename) as new versions are published (e.g., when advance appears at end of year and then final version appears at beginning of following year). include year headings in template? if so could just sort alphabetically under years instead of by work_post_date / work_post_date_fake.

#### `work_title`

- capitalize first word, proper nouns, and the first word after a colon
- do not end with period (inserted by template)
- if title ends with question mark, include this (template will skip inserting default period in this case)

#### `work_doi`

- TODO: formating notes
- ignored if `work_publication_format` is `article_in_edited_work`. template not currently implemented for edited works with DOIs (but could in theory so don't make this a journal-specific property?)

#### `work_post_date`

- used in template to sort chronologically within year. not fully implemented yet. gradually, fill these in. need to decide which post date to use: first publication date? final publication date? generally, indicating the first pub date (e.g., date when advance posted online) and then later updating this to the final publication date (e.g., date when finalized volume/issue comes out). exact dates aren't always clear, so probably fine to guess (e.g., date of google alert, first day of publication month). could include all post dates using separate fields but that seems unnecessary?

#### `work_post_date_fake`

- using increasing integers for newer publications, starting at 1 within each category. currently used in template, eventually switch to using work_post_date.

#### `pdf`

- if null, template won't display title as link

#### `review`

- ignored if `work_publication_format` is `article_in_edited_work`. template not currently implemented for reviews in edited works (but could in theory so don't make this a journal-specific property?)

#### `journal_*`

- ignored if `work_publication_format` is `article_in_edited_work`.

#### `journal_title`

#### `journal_advance`

- for works in process to appear in a publication. eventually cite the published version once this is available, providing info for vol / issue / pages.
- works in this category are considered published? generally (always?) these works are peer-reviewed, available online with the publisher.
- publishers use various names for these editions (e.g., Online First), but it makes sense to be consistent in citing all of these as Advance Online Publication.
- include works that are "in press" including works in the "pre-proof" stage?

#### `journal_preprint`

- distinct from an advance. for posted works (e.g., on bioRxiv, PsyArXiv) that aren't necessarily in process to appear in a publication. if the work is ever published, eventually cite that version instead, providing info for vol / issue / pages.
- works in this category are considered unpublished? generally not (never?) peer reviewed.
- besides works on bioRxiv, what else counts as a preprint? any publically posted work?
- some (?) publishers don't accept works that have already been posted elsewhere.
- ignored if journal_advance is `true`

#### `journal_vol`

#### `journal_issue`

- some journals with online content (e.g., Frontiers, Wiley Interdisciplinary Reviews/WIREs, Scientific Reports, Journal of Experimental Social Psychology) introduce the concept of an article number within a volume or issue (e.g., Frontiers Volume 10, Article 48; WIREs Volume 10, Issue 3, e1487). the corresponding PDF will (always?) have page numbers beginning with 1 (e.g., 1-11). it seems that the suggestion for citing is to indicate the article number as "page(s)" i.e., disregard actual page numbering in PDF. for Frontiers, i've been indicating the article number as "issue" because they only publish by volume, but perhaps i should convert to "pages." for WIREs, can't indicate article number as "issue" because WIREs is already using actual issue numbers; for now, skipped article number in the citation (indicated PDF pages as "pages") but should probably include article number later. for Scientific Reports, NeuroImage have started indicating article number as "page(s)."

#### `journal_pages_start`

#### `journal_pages_stop`

- include both `journal_pages_start` and `journal_pages_stop` even if publication is a single page (i.e., use the same value for each key). the template will handle this.

#### `edited_work_*`

- ignored if `work_publication_format` is `article_in_journal`.

#### `edited_work_type`

- currently, of no consequence to how publication is displayed in template

#### `edited_work_title`

#### `edited_work_pages_start`

- some journals with online content (e.g., Frontiers, Wiley Interdisciplinary Reviews/WIREs) introduce the concept of an article number within a volume or issue (e.g., Frontiers Volume 10, Article 48; WIREs Volume 10, Issue 3, e1487). the corresponding PDF will (always?) have page numbers beginning with 1 (e.g., 1-11). it seems that the suggestion for citing is to indicate the article number as "page(s)" i.e., disregard actual page numbering in PDF. for Frontiers, i've been indicating the article number as "issue" because they only publish by volume, but perhaps i should convert to "pages." for WIREs, can't indicate article number as "issue" because WIREs is already using actual issue numbers; for now, skipped article number in the citation (indicated PDF pages as "pages") but should probably include article number later.

#### `edited_work_pages_stop`

- see above

#### `edited_work_editors`

- for each editor: first initial + middle initial(s) + last name
- period after each initial, space between consecutive initials
- if multiple editors, comma after each (NOT if only two authors), including oxford comma
- use ampersand & before final author (not "and")
- hyphenated names become hyphenated initials, no space (e.g., if middle name is `Jean-Baptise` use `J.-B.`)
- after listing editor(s) include `(Ed.)` or `(Eds.)`

#### `edited_work_location`

#### `edited_work_publisher`

#### `review_type`

- determines whether template displays publication as "Review of" or "Commentary on"

#### `reviewed_work_type`

- template displays this as "Review of/Commentary on the <reviewed_work_type>"

#### `reviewed_work_title`

#### `reviewed_work_author`

- for each author: first initial + middle initial(s) + last name
- period after each initial, space between consecutive initials
- if multiple authors, comma after each (NOT if only two authors), including oxford comma
- use ampersand & before final author (not "and")
- hyphenated names become hyphenated initials, no space (e.g., if middle name is `Jean-Baptise` use `J.-B.`)

#### `link_name`

#### `link_url`

## objects in `resources` array [docs for neuroaesthetics-site data]

key | required | type | format | value(s)
--- | --- | --- | --- | ---
title | yes | string ||
img | yes | absolute file path [neuroaesthetics-site] ||
description | yes | string ||
sources | yes | array || info about `sources` array below

### objects in `sources` array

key | required | type | format | value(s)
--- | --- | --- | --- | ---
title | yes | string ||
links | yes | array || info about `links` array below

### objects in `links` array

key | required | type | format | value(s)
--- | --- | --- | --- | ---
title | yes | string ||
url | yes | string | external URL [or absolute file path?] |

### notes and conventions for objects in `resources` array

- `resources.json` is stored with neuroaesthetics-site (thus far the only JSON stored locally to that project)
- each object in `resources` corresponds to a "high-level" resource
- `resources.sources` includes one or multiple sources for the "high-level" resource (e.g., publications, websites)
- `sources.links` includes one or more links per source (e.g., websites, publications, downloads)

## TODO
* find work_post_date for all pubs
* fill in notes for publications
* constants in enums uppercase with underscore e.g., LAB_DIRECTOR
* camelCase property names?
* be more specific / semantic with property names e.g., photo_path instead of photo, twitter_url instead of twitter

## JSON Schema tools (spec, generate, validate, etc.)

- [JSON Schema](https://json-schema.org/)
- [Create schema from JSON online](https://app.quicktype.io/) ([also](https://www.jsonschema.net/))
- [Validate against schema online](https://www.jsonschemavalidator.net/) ([also](https://jsonschemalint.com/#/version/draft-06/markup/json))
