<?php
/**
 * Settings for the inline documentation feature.
 *
 * The documentation now ships inside the installation (etc/inline_docs.xml, served
 * locally), so there is no host URL or API token to configure — just the on/off
 * switch.
 */
declare(strict_types=1);

namespace MageOS\InlineDocs\Model;

use Magento\Framework\App\Config\ScopeConfigInterface;

class Config
{
    private const XML_ENABLED = 'mageos_inlinedocs/general/enabled';
    private const XML_SHOW_DOC_LINK = 'mageos_inlinedocs/general/show_full_documentation_link';

    public function __construct(
        private readonly ScopeConfigInterface $scopeConfig
    ) {
    }

    public function isEnabled(): bool
    {
        return $this->scopeConfig->isSetFlag(self::XML_ENABLED);
    }

    public function showFullDocumentationLink(): bool
    {
        return $this->scopeConfig->isSetFlag(self::XML_SHOW_DOC_LINK);
    }
}
