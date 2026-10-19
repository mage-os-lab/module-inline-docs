<?php
/**
 * Turns the merged inline_docs.xml DOM into a plain array keyed by element id.
 *
 * Each field becomes a small documentation card: a one-line summary and an
 * optional longer usage body (inline HTML authored in CDATA), plus the owning
 * module, section label and admin path carried as attributes.
 */
declare(strict_types=1);

namespace MageOS\InlineDocs\Model\Config;

use Magento\Framework\Config\ConverterInterface;

class Converter implements ConverterInterface
{
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
                'summary' => $this->childText($field, 'summary'),
                // Kept as authored so inline markup survives; the view treats it as HTML.
                'usage'   => $this->childMarkup($field, 'usage'),
                'module'  => trim((string)$field->getAttribute('module')),
                'section' => trim((string)$field->getAttribute('section')),
                'path'    => trim((string)$field->getAttribute('path')),
                'url'     => trim((string)$field->getAttribute('url')),
            ];
        }

        return ['fields' => $fields];
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
