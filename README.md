# MageOS_InlineDocs

In-admin documentation for **Magento / Mage-OS**: a small marker next to a
**Stores → Configuration** field opens a documentation card explaining what that
setting actually does — the field's own label as the heading, its config path, a
one-line summary, a fuller explanation, the **accepted values** for a dropdown, a
**technical details** block (config path, scope, source/backend model, default,
dependencies), and the owning module.

<img width="1077" height="782" alt="inline_docs_v2" src="https://github.com/user-attachments/assets/6c78bae5-b0be-4550-877e-f57213a6e979" />



The notes **ship inside the module** and are served locally. There is no external
documentation service, no API token, and no HTTP call on page load — so it is safe
to install anywhere and it never depends on anything being reachable.

A marker appears beside any field this module has a note for. Where a field has no
native help, the card is the only documentation it gets; where Magento already ships
a brief `<comment>`, the card sits alongside it and goes deeper.

## What ships with it

Notes for **~7,400 Mage-OS / Magento core configuration fields** — effectively the
whole of **Stores → Configuration** for core. Each carries a structured card:

- a one-line **summary** and a fuller **usage** explanation,
- a **technical details** block (config path, scope, source/backend/frontend model,
  default value, dependencies) — all extracted facts, not invented,
- **accepted values** with per-option descriptions for ~4,900 select fields.

Nine high-traffic sections — Inventory, Sales, Catalog, Customer, Checkout, Payment,
Shipping, General and Web — are authored to full depth, with prose grounded in each
field's source classes. The rest carry concise generated notes plus the same card,
technical facts and accepted values. Store-specific option sources (customer groups,
CMS pages, tax classes, …) are deliberately **not** listed as values, so nothing
from one installation leaks into the shipped notes.

## How a field is matched to a note

Magento renders each config field with `id="section_group_field"`, built by
`Config\Block\System\Config\Form::_generateElementId()` as
`str_replace('/', '_', $path)`. That transformation is **lossy** — field names
contain underscores — so the path can't be reconstructed from the id with any
certainty.

So this module never tries. The page reports the element ids it can see; the
module matches them against ids recorded in `inline_docs.xml`. A lookup, not a
guess. (The schema requires each `id` to be unique, so a lookup never collides.)

## Where the notes come from

Every module may ship an `etc/inline_docs.xml`. They are validated against
`inline_docs.xsd`, merged across all modules, and cached — exactly like Magento's
own XML config types. So a third-party module can document its own fields simply
by shipping one.

```xml
<config xsi:noNamespaceSchemaLocation="urn:magento:module:MageOS_InlineDocs:etc/inline_docs.xsd">
    <field id="cataloginventory_item_options_backorders"
           module="Magento_CatalogInventory"
           section="Inventory"
           path="cataloginventory/item_options/backorders">
        <summary>Whether customers can order more than the quantity in stock.</summary>
        <usage><![CDATA[<p>Controls what happens when a shopper orders beyond available
            stock. Allowing backorders lets quantity fall below zero so the order is
            still accepted.</p>]]></usage>
        <values>
            <value id="0" label="No Backorders">Orders cannot exceed available stock.</value>
            <value id="1" label="Allow Qty Below 0">Stock may go negative; orders are accepted with no notice to the customer.</value>
            <value id="2" label="Allow Qty Below 0 and Notify Customer">Backorders are accepted and the shopper is told the item is backordered.</value>
        </values>
        <technical>
            <config_path>cataloginventory/item_options/backorders</config_path>
            <scope>Global</scope>
            <source_model>Magento\CatalogInventory\Model\Source\Backorders</source_model>
        </technical>
    </field>
</config>
```

Only `summary` is required; everything below it is optional, so a field may carry a
one-liner or a full card.

- **`summary`** — the one-line lead shown bold at the top of the card (also the best
  candidate for the field's own native `<comment>`).
- **`usage`** — the fuller explanation. May carry a small set of inline HTML
  (`p`, `ul`/`ol`/`li`, `code`, `strong`, `em`, `a`, `br`), authored in CDATA.
- **`values`** — per-option meaning for select/multiselect fields.
- **`technical`** — extracted facts: `config_path`, `default_value`, `scope`,
  `source_model`, `backend_model`, `frontend_model`, `validation`, `depends`.
- Attributes: **`id`** (the DOM join key, required), **`module`** and **`section`**
  (shown in the footer), **`path`** (the card's config-path pill), and an optional
  **`url`** for the "Full documentation" link.

The bundled core notes are generated by the companion
[magento-doc-generator](https://github.com/nicolasperic/magento-doc-generator):
deterministic extraction from each module's `system.xml` and the live, merged admin
config (so `path`, `scope`, models, defaults and resolved option values are read, not
guessed) → grounded prose → `inline_docs.xml`.

## Install

```bash
composer require mage-os-lab/module-inline-docs
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
| Enable Inline Documentation | Off by default. Everything is served locally. |
| Show "Full documentation" Link | Off by default. When on, a note that defines a URL also shows a link through to it. |

## Architecture

- **`inline_docs.xml` config type** — `Model/Config/{Reader,Converter,SchemaLocator,Data}`
  parse, validate, merge and cache every module's notes into one id-keyed map.
- **`Model/InlineDocProvider`** — resolves a page's element ids to their cards from
  that map, pairing each technical fact with a translated label. No network, no
  token; a miss simply returns nothing.
- **`Controller/Adminhtml/Inline/Fetch`** — one request per page returns the
  cards for the ids on it.
- **`view/adminhtml/web/js/inline-docs.js`** — renders the marker and the card
  (hover to open, click to pin). The `usage` HTML is rebuilt client-side from a
  whitelist of inline tags, so a note can never inject script or markup.

Every failure path returns empty and logs. A documentation aid must never break
the screen it decorates.

## License

MIT — see [LICENSE](LICENSE).



## Previous Version UI

<img width="1077" height="482" alt="inline_docs" src="https://github.com/user-attachments/assets/c48b7726-4f70-42c9-9eac-9b9ebf3464df" />
