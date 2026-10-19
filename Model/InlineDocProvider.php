<?php
/**
 * Resolves inline documentation for a set of admin config element ids, from the
 * locally-merged inline_docs configuration. The data ships inside the
 * installation, so there is no external documentation host to reach, no token,
 * and nothing to fail — a miss simply returns nothing.
 *
 * Each hit is reshaped into what the popover renders: a summary, an optional
 * usage body, the owning module, and the admin path (offered as a copy value).
 */
declare(strict_types=1);

namespace MageOS\InlineDocs\Model;

use MageOS\InlineDocs\Model\Config\Data as InlineDocsConfig;

class InlineDocProvider
{
    public function __construct(
        private readonly InlineDocsConfig $config
    ) {
    }

    /**
     * @param  string[] $elementIds Admin DOM ids, e.g. "catalog_seo_product_url_suffix"
     * @return array<string, array>
     */
    public function fetch(array $elementIds): array
    {
        $fields = (array)$this->config->get('fields', []);
        $blocks = [];

        foreach ($elementIds as $id) {
            $id = trim((string)$id);
            if ($id === '' || !isset($fields[$id])) {
                continue;
            }
            $f = $fields[$id];
            // A field must carry at least a lead line to be worth a marker.
            if (trim((string)($f['summary'] ?? '')) === '') {
                continue;
            }
            $blocks[$id] = [
                'summary'    => (string)($f['summary'] ?? ''),
                'usage'      => (string)($f['usage'] ?? ''),
                'path'       => (string)($f['path'] ?? ''),
                'moduleName' => (string)($f['module'] ?? ''),
                'title'      => (string)($f['section'] ?? '') ?: (string)($f['module'] ?? ''),
                'url'        => (string)($f['url'] ?? ''),
            ];
        }

        return $blocks;
    }
}
