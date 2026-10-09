<?php
/**
 * Turns the merged inline_docs.xml DOM into a plain array keyed by element id.
 *
 * Each field becomes a documentation card: a one-line summary, an optional
 * longer usage body (inline HTML authored in CDATA), the accepted values for a
 * select field, and a block of extracted technical facts. The technical facts
 * are emitted in a fixed presentation order here so the view never has to sort.
 */
declare(strict_types=1);

namespace MageOS\InlineDocs\Model\Config;

use Magento\Framework\Config\ConverterInterface;

class Converter implements ConverterInterface
{
    /** Technical facts, in the order the card presents them. */
    private const TECHNICAL_NODES = [
        'config_path',
        'default_value',
        'scope',
        'source_model',
        'backend_model',
        'frontend_model',
        'validation',
        'depends',
        'consumed_by',
    ];

    /**
     * @param \DOMDocument $source
     * @return array{fields: array<string, array>}
     */
    public function convert($source): array
    {
        $fields = [];

        foreach ($source->getElementsByTagName('field') as $field) {
            /** @var \DOMElement $field */
            $id = trim((string)$field->getAttribute('id'));
            if ($id === '') {
                continue;
            }

            $fields[$id] = [
                'summary'   => $this->childText($field, 'summary'),
                // Kept as authored so inline markup survives; the view treats it as HTML.
                'usage'     => $this->childMarkup($field, 'usage'),
                'values'    => $this->convertValues($field),
                'technical' => $this->convertTechnical($field),
                'module'    => trim((string)$field->getAttribute('module')),
                'section'   => trim((string)$field->getAttribute('section')),
                'path'      => trim((string)$field->getAttribute('path')),
                'url'       => trim((string)$field->getAttribute('url')),
            ];
        }

        return ['fields' => $fields];
    }

    /**
     * @return array<int, array{id:string, label:string, description:string}>
     */
    private function convertValues(\DOMElement $field): array
    {
        $values = [];
        foreach ($this->childElements($field, 'values') as $valuesNode) {
            foreach ($this->childElements($valuesNode, 'value') as $valueNode) {
                $values[] = [
                    'id'          => (string)$valueNode->getAttribute('id'),
                    'label'       => (string)$valueNode->getAttribute('label'),
                    'description' => $this->normalize($valueNode->textContent),
                ];
            }
        }

        return $values;
    }

    /**
     * @return array<string, string> fixed-order technical facts, present ones only
     */
    private function convertTechnical(\DOMElement $field): array
    {
        $technical = [];
        foreach ($this->childElements($field, 'technical') as $node) {
            foreach (self::TECHNICAL_NODES as $name) {
                $value = $this->childText($node, $name);
                if ($value !== '') {
                    $technical[$name] = $value;
                }
            }
        }

        return $technical;
    }

    /** Collapsed plain-text content of the first matching direct child. */
    private function childText(\DOMElement $parent, string $name): string
    {
        foreach ($this->childElements($parent, $name) as $child) {
            return $this->normalize($child->textContent);
        }

        return '';
    }

    /** Raw (trimmed) content of the first matching direct child, markup preserved. */
    private function childMarkup(\DOMElement $parent, string $name): string
    {
        foreach ($this->childElements($parent, $name) as $child) {
            return trim($child->textContent);
        }

        return '';
    }

    /**
     * @return \DOMElement[] direct child elements with the given tag name
     */
    private function childElements(\DOMElement $parent, string $name): array
    {
        $matches = [];
        foreach ($parent->childNodes as $child) {
            if ($child instanceof \DOMElement && $child->nodeName === $name) {
                $matches[] = $child;
            }
        }

        return $matches;
    }

    private function normalize(string $value): string
    {
        return trim((string)preg_replace('/\s+/', ' ', $value));
    }
}
