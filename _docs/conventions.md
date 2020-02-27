# Conventions

## Unicode

- Unicode is OK to use in HTML (e.g., `<p>Göksun et al.</p>`)

## Liquid

### Empty strings and nulls

For optional keys, Liquid template logic should be constructed so the same behavior is seen for:

- Keys with `null` value
- Missing keys (when Netlify CMS processes user JSON / YAML, it reformats to remove any keys with `null` value)
- Empty strings (when user erases an optional field in Netlify CMS it's represented as an empty string, not `null`)

Liquid variables that are null or undefined are falsy, but empty string is truthy. In practice, the following construction should work:

```
{% if foo and foo != "" %}Do things{% endif %}
```

### Smart quotes

- Use Jekyll's custom Liquid filters to convert with straight quotes and apostrophes entered via text editor or Netlify CMS interface:

  ```
  {{ foo | smartify }}
  ```

## JSON

- Escape double quotes with `\"`

## News

- See json-validation.md

## Publications

- See json-validation.md

## People

- See json-validation.md

## Filenames

- For decomposable characters like `ñ` where `%C3%B1` is equivalent to `n%CC%83`, it's not clear whether it's better to use precomposed (NFC) or decomposed (NFD) version.

  As of macOS 10.13.6 the long-press shortcut to type characters with diacritics renders the precomposed version, but the macOS file system converts to decomposed version. Linux and Windows usually (?) use precomposed characters in filenames.

  By default, Git config on macOS is set to  core.precomposeunicode=true which means decomposed filenames are converted to precomposed.

  Issues can arise on the server when an html reference and the corresponding filename use different representations of the same character (broken link).

  Use closest-looking ASCII character:

  Ö > O

  ö > o

  ñ > n

  ı > i

  Formerly (still 404):

  Use percent encoding for special characters. Seems fool-proof, if kind of dumb-looking and time consuming. To be consistent, use precomposed (arbitrary decision).

  Formerly (error-prone):

  If on macOS, name the file using long-press / precomposed version; will automatically convert to decomposed version. Copy-paste decomposed version from filename into html. Upload file and html to server (both decomposed). Commit both to Git - filename converted to precomposed, html still decomposed but who cares? Maybe broken links if pull from git to Windows and try to upload to server?
