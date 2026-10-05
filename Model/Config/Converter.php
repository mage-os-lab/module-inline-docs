<?php
/**
 * Turns the merged inline_docs.xml DOM into a plain array keyed by element id:
 *   ['fields' => ['section_group_field' => ['comment'=>…, 'modal'=>…, 'module'=>…, 'section'=>…]]]
 */
declare(strict_types=1);

namespace MageOS\InlineDocs\Model\Config;

use Magento\Framework\Config\ConverterInterface;

class Converter implements ConverterInterface
{
    /**
     * @param \DOMDocument $source
     * @return array{fields: array<string, array{comment:string, modal:string, module:string, section:string}>}
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

            $comment = '';
            $modal = '';
            foreach ($field->childNodes as $child) {
                if ($child->nodeName === 'comment') {
                    $comment = trim($child->nodeValue);
                } elseif ($child->nodeName === 'modal') {
                    $modal = trim($child->nodeValue);
                }
            }

            $fields[$id] = [
                'comment' => $comment,
                'modal'   => $modal,
                'module'  => trim((string)$field->getAttribute('module')),
                'section' => trim((string)$field->getAttribute('section')),
                'url'     => trim((string)$field->getAttribute('url')),
            ];
        }

        return ['fields' => $fields];
    }
}
