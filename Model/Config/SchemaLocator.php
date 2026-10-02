<?php
/**
 * Points the config framework at inline_docs.xsd so every module's
 * inline_docs.xml is validated on read.
 */
declare(strict_types=1);

namespace MageOS\InlineDocs\Model\Config;

use Magento\Framework\Config\SchemaLocatorInterface;
use Magento\Framework\Module\Dir;
use Magento\Framework\Module\Dir\Reader as ModuleDirReader;

class SchemaLocator implements SchemaLocatorInterface
{
    private string $schema;

    public function __construct(ModuleDirReader $moduleReader)
    {
        $this->schema = $moduleReader->getModuleDir(Dir::MODULE_ETC_DIR, 'MageOS_InlineDocs')
            . '/inline_docs.xsd';
    }

    public function getSchema(): ?string
    {
        return $this->schema;
    }

    public function getPerFileSchema(): ?string
    {
        return $this->schema;
    }
}
