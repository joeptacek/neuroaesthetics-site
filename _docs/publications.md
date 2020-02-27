# research page

## publication_list (array)

array of `publication` objects

## publication (object)

### work_authors (string)

for each author: last name + comma + first initial + middle initial(s)

period after each initial, space between consecutive initials

if multiple authors, comma after each (even if only two authors), including oxford comma

use ampersand & before final author, not "and"

hyphenated names become hyphenated initials, no space (e.g., if middle name is `Jean-Baptise` use `J.-B.`)

### work_year (string)

four-digit year

### work_title (string)

capitalize first word, proper nouns, and the first word after a colon

do not end with period (inserted by template)

if title ends with question mark, include this (template will skip inserting default period in this case)

### work_publication_format (string)

either `article_in_journal` or `article_in_edited_work`

### journal_data (object)

contains journal data, see below (null if not a journal item)

### edited_work_data (object)

contains journal data, see below (null if not an edited work item)

### pdf_filename (string)

filename for .pdf file if this exists, otherwise null will be handled as "missing file" (won't display title as link)

might be best to change this to absolute path

### journal_title

### advance_tf

### journal_vol

### journal_issue

as applicable

### journal_pages_start

### journal_pages_stop

### doi

TODO: formatting notes

### review_tf (boolean)

### review_data (object)

see below

## edited_work_data object

### edited_work_type

### edited_work_title

### edited_work_pages_start

### edited_work_pages_stop

### edited_work_editors

### edited_work_location

### edited_work_publisher

## review_data object

#### review_type

`commentary` or `review`

#### reviewed_work_type

#### reviewed_work_title

#### reviewed_work_author

## examples

### publication appearing in a journal

```yml
work_authors: 'Karaduman, A., Göksun, T., & Chatterjee, A.'
work_year: 2017
work_title: 'Narratives of focal brain injured individuals: A macro-level analysis'
work_publication_format: 'article_in_journal'
journal_data:
  journal_title: 'Neuropsychologia'
  advance_tf: false
  journal_vol: 99
  journal_issue: null
  journal_pages_start: 314
  journal_pages_stop: 325
  doi: '10.1016/j.neuropsychologia.2017.03.027'
  review_tf: false
  review_data: null
edited_work_data: null
pdf_filename: 'Karaduman_Göksun_Chatterjee_2017_01.pdf'
```

### publication appearing in a journal (review)

```yml
work_authors: 'Chatterjee, A.'
work_year: 2017
work_title: 'Orange is the new aesthetic'
work_publication_format: 'article_in_journal'
journal_data:
  journal_title: 'Behavioral and Brain Sciences'
  advance_tf: false
  journal_vol: 40
  journal_issue: 355
  journal_pages_start: 1
  journal_pages_stop: 2
  doi: '10.1017/S0140525X17001637'
  review_tf: true
  review_data:
    review_type: 'commentary'
    reviewed_work_type: 'journal article'
    reviewed_work_title: 'The Distancing-Embracing model of the enjoyment of negative emotions in art reception'
    reviewed_work_author: 'W. Menninghaus, V. Wagner, J. Hanich, E. Wassiliwizky, T. Jacobsen, & S. Koelsch'
edited_work_data: null
pdf_filename: 'Chatterjee_2017_01.pdf'
```

### publication appearing in an edited work

```yml
work_authors: 'Özer, D., Tansan, M., Özer, E. E., Malykhina, K., Chatterjee, A., & Göksun, T.'
work_year: 2017
work_title: 'The effects of gesture restriction on spatial language in young and elderly adults'
work_publication_format: 'article_in_edited_work'
journal_data: null
edited_work_data:
  edited_work_type: 'conference'
  edited_work_title: 'Proceedings of the 39th Annual Meeting of the Cognitive Science Society'
  edited_work_pages_start: 1471
  edited_work_pages_stop: 1476
  edited_work_editors: 'G. Gunzelmann, A. Howes, T. Tenbrink, & E. Davelaar (Eds.)'
  edited_work_location: 'Austin, TX'
  edited_work_publisher: 'Cognitive Science Society'
pdf_filename: 'Özer_Tansan_Özer_Malykhina_Chatterjee_Göksun_2017_01.pdf'
```
