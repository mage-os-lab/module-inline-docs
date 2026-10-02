# MageOS_InlineDocs

In-admin documentation for **Magento / Mage-OS**: a small marker next to a
**Stores → Configuration** field opens a card explaining what that setting
actually does — and, where there's more to say, a **More details** panel.

The notes **ship inside the module** and are served locally. There is no external
documentation service, no API token, and no HTTP call on page load — so it is safe
to install anywhere and it never depends on anything being reachable.

A marker appears only beside a field this module has a note for — which are the
fields that ship with **no native `<comment>`** of their own, the gap this fills.
Fields Magento already documents keep their own inline note and get no marker, so
the two never duplicate.

## What ships with it

Notes for **~706 Mage-OS / Magento core configuration fields** that had no
`<comment>` help of their own (of 1,120 core fields, only ~32% had any). Each note
is grounded in the field's own definition — its label, type, source model, scope
and dependencies — not invented.

## How a field is matched to a note

Magento renders each config field with `id="section_group_field"`, built by
`Config\Block\System\Config\Form::_generateElementId()` as
`str_replace('/', '_', $path)`. That transformation is **lossy** — field names
contain underscores — so the path can't be reconstructed from the id with any
certainty.

So this module never tries. The page reports the element ids it can see; the
module matches them against ids recorded in `inline_docs.xml`. A lookup, not a
guess. (Across Mage-OS core, 1,117 config paths produce 1,117 distinct element
ids — no collisions.)

## Where the notes come from

Every module may ship an `etc/inline_docs.xml`. They are validated against
`inline_docs.xsd`, merged across all modules, and cached — exactly like Magento's
own XML config types. So a third-party module can document its own fields simply
by shipping one.

```xml
<config xsi:noNamespaceSchemaLocation="urn:magento:module:MageOS_InlineDocs:etc/inline_docs.xsd">
    <field id="checkout_options_guest_checkout" module="Magento_Checkout" section="Checkout">
        <comment>Lets shoppers place an order without creating or signing into an account.</comment>
        <modal>When **Yes**, customers can check out as a guest. When **No**, they must sign in.</modal>
    </field>
</config>
```

`comment` is the short popover note (a candidate for the field's own `<comment>`);
`modal` is the optional longer explanation, in a small Markdown subset
(`**bold**`, `` `code` ``, *italics*, links).

The bundled core notes are generated from each module's `system.xml` by the
companion [magento-doc-generator](https://github.com/nicolasperic/magento-doc-generator)
(deterministic extraction → grounded prose → `inline_docs.xml`).

## Install

```bash
composer require nicolasperic/module-inline-docs
bin/magento module:enable MageOS_InlineDocs
bin/magento setup:upgrade
bin/magento cache:flush
```

Then turn it on: **Stores → Configuration → Advanced → Inline Documentation →
Enable Inline Documentation → Yes**.

## Configuration

**Stores → Configuration → Advanced → Inline Documentation**

| Setting | Notes |
|---|---|
| Enable Inline Documentation | Off by default. The only setting — everything is served locally. |

## Architecture

- **`inline_docs.xml` config type** — `Model/Config/{Reader,Converter,SchemaLocator,Data}`
  parse, validate, merge and cache every module's notes into one id-keyed map.
- **`Model/InlineDocProvider`** — resolves a page's element ids to their notes
  from that map. No network, no token; a miss simply returns nothing.
- **`Controller/Adminhtml/Inline/Fetch`** — one request per page returns the
  notes for the ids on it.
- **`view/adminhtml/web/js/inline-docs.js`** — renders the marker, the popover and
  the *More details* panel; any content is HTML-escaped before the tiny Markdown
  subset is applied, so a note can never inject markup.

Every failure path returns empty and logs. A documentation aid must never break
the screen it decorates.

## License

MIT — see [LICENSE](LICENSE).
