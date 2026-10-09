<?php
/**
 * Resolves inline documentation for a set of admin config element ids, from the
 * locally-merged inline_docs configuration. The data ships inside the
 * installation, so there is no external documentation host to reach, no token,
 * and nothing to fail — a miss simply returns nothing.
 *
 * Each hit is reshaped into what the popover renders: a summary, a usage body,
 * the accepted values, and the technical facts paired with translated labels
 * (translated here so they go through the normal i18n pipeline, not JavaScript).
 */
declare(strict_types=1);

namespace MageOS\InlineDocs\Model;

use Magento\Framework\Phrase;
use MageOS\InlineDocs\Model\Config\Data as InlineDocsConfig;

class InlineDocProvider
{
    /** @var array<string, Phrase>|null */
    private ?array $technicalLabels = null;

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
                'values'     => array_values((array)($f['values'] ?? [])),
                'technical'  => $this->presentTechnical((array)($f['technical'] ?? [])),
                'path'       => (string)($f['path'] ?? ''),
                'title'      => (string)($f['section'] ?? '') ?: (string)($f['module'] ?? ''),
                'moduleName' => (string)($f['module'] ?? ''),
                'url'        => (string)($f['url'] ?? ''),
            ];
        }

        return $blocks;
    }

    /**
     * Pair each technical fact with its translated label, keeping declaration order.
     *
     * @param  array<string, string> $technical
     * @return array<int, array{label:string, value:string}>
     */
    private function presentTechnical(array $technical): array
    {
        $labels = $this->getTechnicalLabels();
        $rows = [];
        foreach ($technical as $name => $value) {
            if (!isset($labels[$name]) || trim((string)$value) === '') {
                continue;
            }
            $rows[] = ['label' => (string)$labels[$name], 'value' => (string)$value];
        }

        return $rows;
    }

    /** @return array<string, Phrase> */
    private function getTechnicalLabels(): array
    {
        if ($this->technicalLabels === null) {
            $this->technicalLabels = [
                'config_path'    => __('Config path'),
                'default_value'  => __('Default'),
                'scope'          => __('Scope'),
                'source_model'   => __('Source model'),
                'backend_model'  => __('Backend model'),
                'frontend_model' => __('Frontend model'),
                'validation'     => __('Validation'),
                'depends'        => __('Depends on'),
                'consumed_by'    => __('Read by'),
            ];
        }

        return $this->technicalLabels;
    }
}
