<?php
/**
 * Resolves inline documentation for a set of admin config element ids, from the
 * locally-merged inline_docs configuration. This replaces the old HTTP DocClient:
 * the data ships inside the installation, so there is no external documentation
 * host to reach, no token, and nothing to fail — a miss simply returns nothing.
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
     * @return array<string, array{markdown:string, modal:string, title:string, moduleName:string}>
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
            if (($f['comment'] ?? '') === '' && ($f['modal'] ?? '') === '') {
                continue;
            }
            $blocks[$id] = [
                // `markdown` is the short form; `modal` the full note the popover shows.
                'markdown'   => (string)($f['comment'] ?? ''),
                'modal'      => (string)($f['modal'] ?? ''),
                'title'      => (string)($f['section'] ?? '') ?: (string)($f['module'] ?? ''),
                'moduleName' => (string)($f['module'] ?? ''),
                'url'        => (string)($f['url'] ?? ''),
            ];
        }

        return $blocks;
    }
}
