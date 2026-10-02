<?php
/**
 * Cached, merged inline-docs configuration. The parse-and-merge of every
 * module's inline_docs.xml happens once and is cached (config cache type), so
 * serving help to the admin page is an in-memory array lookup.
 */
declare(strict_types=1);

namespace MageOS\InlineDocs\Model\Config;

use Magento\Framework\Config\Data as ConfigData;

class Data extends ConfigData
{
}
