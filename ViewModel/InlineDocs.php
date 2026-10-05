<?php
/**
 * Hands the page the two things the script needs: whether the feature is on, and
 * the URL of this module's own controller that serves the per-page notes.
 */
declare(strict_types=1);

namespace MageOS\InlineDocs\ViewModel;

use Magento\Framework\UrlInterface;
use Magento\Framework\View\Element\Block\ArgumentInterface;
use MageOS\InlineDocs\Model\Config;

class InlineDocs implements ArgumentInterface
{
    public function __construct(
        private readonly Config $config,
        private readonly UrlInterface $urlBuilder
    ) {
    }

    public function isEnabled(): bool
    {
        return $this->config->isEnabled();
    }

    public function showDocLink(): bool
    {
        return $this->config->showFullDocumentationLink();
    }

    public function getFetchUrl(): string
    {
        return $this->urlBuilder->getUrl('mageos_inlinedocs/inline/fetch');
    }
}
