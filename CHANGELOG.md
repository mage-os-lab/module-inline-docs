# Changelog

All notable changes to this module are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and the project adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Self-contained documentation delivery: admin config-field notes ship inside the
  module as `etc/inline_docs.xml` and are served locally — no external
  documentation host, API token, or runtime HTTP.
- `inline_docs.xml` config type (XSD-validated, merged across modules, cached):
  any module can ship its own notes.
- In-place **More details** expander in the popover for the longer explanation.
- Bundled notes for ~706 Mage-OS / Magento core configuration fields.

### Changed
- `Enable Inline Documentation` is now the only setting; the base-URL, public-URL,
  API-token and cache-lifetime settings were removed.

### Removed
- `DocClient` and the HTTP proxy to an external documentation host.
