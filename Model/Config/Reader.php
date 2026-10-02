<?php
/**
 * Reads every module's etc/inline_docs.xml, validates it against inline_docs.xsd
 * and merges them. `$_idAttributes` tells the DOM merger that a <field> is
 * identified by its `id`, so a later module can override or add a field's help.
 */
declare(strict_types=1);

namespace MageOS\InlineDocs\Model\Config;

use Magento\Framework\Config\Reader\Filesystem;

class Reader extends Filesystem
{
    /**
     * @var array<string, string>
     */
    protected $_idAttributes = [
        '/config/field' => 'id',
    ];
}
