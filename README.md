# MageOS_InlineDocs

Renders module documentation **inside the Magento admin**, next to the configuration
field it describes.

A small marker appears beside any config field that has a note written for it. Clicking
it opens a card with one or two sentences about what that setting actually does — and a
link through to the module's full documentation page.

Fields with nothing written about them get no marker at all. That is the intended
behaviour, not a gap: coverage is not the goal, usefulness is.

## Why it exists

Of the 1,120 configuration fields in Mage-OS core, **764 (68%) have no `<comment>` help
text of any kind**. For those fields, this is the first in-place explanation they have
ever had.

## How a field is matched to a note

Magento renders each config field with `id="section_group_field"`, produced by
`Config\Block\System\Config\Form::_generateElementId()` as
`str_replace('/', '_', $path)`.

That transformation is **lossy** — field names contain underscores, so
`catalog_seo_product_url_suffix` cannot be split back into `catalog/seo/product_url_suffix`
with any certainty. So this module never tries. The page sends the element ids it can
see, and the documentation side matches them against ids the generator recorded when it
read `system.xml`. A lookup, not a guess. (Verified across Mage-OS: 1,117 config paths
produce 1,117 distinct element ids — no collisions.)

## Request shape

One request per page, never one per field: a single config section can hold sixty-odd
fields.

```
admin page  ──ids──▶  mageos_inlinedocs/inline/fetch  ──▶  <doc host>/api/inline
                          (token stays server-side,
                           response cached in Magento)
```

The browser never talks to the documentation host directly. That keeps the API token
out of the page, means the doc host needs no CORS configuration, and lets the response
be cached so the admin does not depend on the doc host being up.

Every failure path returns empty and logs. A documentation aid must never break the
screen it decorates.

## Configuration

**Stores → Configuration → Advanced → Inline Documentation**

| Setting | Notes |
|---|---|
| Enable Inline Documentation | Off by default |
| Documentation Base URL | e.g. `http://localhost:3000`, no trailing slash |
| API Token | Stored encrypted; never sent to the browser |
| Cache Lifetime | Seconds. Documentation changes rarely, so a long value is fine |

## Install

```bash
ln -s /path/to/magento-doc-generator/magento-module/MageOS \
      /path/to/magento/app/code/MageOS

bin/magento module:enable MageOS_InlineDocs
bin/magento setup:upgrade
bin/magento cache:flush
```
