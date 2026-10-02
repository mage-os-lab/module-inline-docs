<?php
/**
 * Serves inline documentation for the config element ids on the current admin
 * page, from the locally-bundled inline-docs data. One request per page (a
 * section can hold sixty-odd fields); the lookup is an in-memory array read, so
 * there is no external documentation host and nothing to fail.
 */
declare(strict_types=1);

namespace MageOS\InlineDocs\Controller\Adminhtml\Inline;

use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Framework\Controller\Result\JsonFactory;
use Magento\Framework\Controller\ResultInterface;
use MageOS\InlineDocs\Model\InlineDocProvider;

class Fetch extends Action
{
    public const ADMIN_RESOURCE = 'Magento_Config::config';

    public function __construct(
        Context $context,
        private readonly JsonFactory $resultJsonFactory,
        private readonly InlineDocProvider $docProvider
    ) {
        parent::__construct($context);
    }

    public function execute(): ResultInterface
    {
        $result = $this->resultJsonFactory->create();

        $elements = $this->getRequest()->getParam('elements');
        if (is_string($elements)) {
            $elements = array_filter(explode(',', $elements));
        }
        if (!is_array($elements) || !$elements) {
            return $result->setData(['blocks' => (object)[]]);
        }

        $blocks = $this->docProvider->fetch($elements);

        // (object) so an empty result serialises as {} rather than [] — the page
        // expects a map and an empty array would read as a different shape.
        return $result->setData(['blocks' => $blocks ?: (object)[]]);
    }
}
