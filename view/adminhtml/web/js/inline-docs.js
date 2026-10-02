/**
 * Inline documentation markers for the admin configuration screens.
 *
 * How the field is identified
 * --------------------------
 * Magento renders each config field with id="section_group_field", built by
 * Config\Block\System\Config\Form::_generateElementId() as str_replace('/', '_', $path).
 * That transformation is LOSSY — field names contain underscores, so
 * "catalog_seo_product_url_suffix" cannot be split back into a path unambiguously.
 *
 * So this script never tries. It collects the element ids it can see, sends them to
 * the module's own controller, and the documentation side matches them against ids
 * the generator recorded. A lookup, not a guess.
 *
 * Everything is one request per page: a section can hold sixty fields, and sixty
 * requests would be worse than no documentation at all. Fields with nothing written
 * about them get no marker, which is the intended outcome rather than a gap.
 */
define(['jquery', 'mage/translate'], function ($, $t) {
    'use strict';

    var POPOVER_WIDTH = 360,
        VIEWPORT_MARGIN = 12,
        state = { open: null, popover: null, anchor: null };

    /**
     * Render the small subset of Markdown these notes actually use.
     * HTML is escaped FIRST, so note content can never inject markup.
     */
    function renderMarkdown(src) {
        var html = String(src)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        html = html
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>')
            .replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

        return html
            .split(/\n{2,}/)
            .map(function (para) { return '<p>' + para.replace(/\n/g, ' ') + '</p>'; })
            .join('');
    }

    function closePopover() {
        if (!state.popover) {
            return;
        }
        state.popover.remove();
        if (state.anchor) {
            state.anchor.attr('aria-expanded', 'false').removeClass('mosdoc-marker--active');
        }
        state.popover = null;
        state.anchor = null;
        state.open = null;
    }

    /** Position the card against its marker, flipping above when there's no room below. */
    function place($popover, $anchor) {
        var rect = $anchor[0].getBoundingClientRect(),
            width = Math.min(POPOVER_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2),
            height = $popover.outerHeight(),
            left = rect.left + rect.width / 2 - width / 2,
            top = rect.bottom + 10,
            flipped = false;

        left = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - width - VIEWPORT_MARGIN));

        if (top + height > window.innerHeight - VIEWPORT_MARGIN && rect.top > height + 20) {
            top = rect.top - height - 10;
            flipped = true;
        }

        $popover
            .css({ width: width + 'px', left: Math.round(left) + 'px', top: Math.round(top) + 'px' })
            .toggleClass('mosdoc-popover--above', flipped)
            .find('.mosdoc-popover__arrow')
            .css('left', Math.round(rect.left + rect.width / 2 - left) + 'px');
    }

    function openPopover($anchor, block) {
        closePopover();

        var hasModal = !!(block.modal && String(block.modal).trim()),
            $popover = $(
                '<div class="mosdoc-popover" role="dialog" aria-modal="false">' +
                    '<span class="mosdoc-popover__arrow"></span>' +
                    '<div class="mosdoc-popover__body"></div>' +
                    '<div class="mosdoc-popover__more" hidden></div>' +
                    '<div class="mosdoc-popover__foot">' +
                        '<span class="mosdoc-popover__module"></span>' +
                    '</div>' +
                '</div>'
            );

        $popover.find('.mosdoc-popover__body').html(renderMarkdown(block.markdown || ''));
        $popover.find('.mosdoc-popover__module').text(block.title || block.moduleName || '');

        // The longer explanation is revealed in place rather than linking off to
        // an external documentation site — the notes ship with the module.
        if (hasModal) {
            var $more = $popover.find('.mosdoc-popover__more').html(renderMarkdown(String(block.modal)));
            var $toggle = $('<button/>', {
                type: 'button',
                'class': 'mosdoc-popover__toggle',
                'aria-expanded': 'false',
                text: $t('More details')
            });
            $toggle.on('click', function () {
                var expanded = !$more.prop('hidden');
                $more.prop('hidden', expanded);
                $toggle
                    .attr('aria-expanded', String(!expanded))
                    .text(expanded ? $t('More details') : $t('Show less'));
                if (state.anchor) { place($popover, state.anchor); }
            });
            $toggle.prependTo($popover.find('.mosdoc-popover__foot'));
        }

        $('body').append($popover);
        place($popover, $anchor);
        // Next frame, so the transition actually runs rather than being skipped.
        window.requestAnimationFrame(function () { $popover.addClass('mosdoc-popover--visible'); });

        $anchor.attr('aria-expanded', 'true').addClass('mosdoc-marker--active');
        state.popover = $popover;
        state.anchor = $anchor;
        state.open = $anchor.data('mosdocKey');
    }

    /** The label cell of a config row, which is where the marker belongs. */
    function labelTargetFor(elementId) {
        var $row = $(document.getElementById('row_' + elementId));

        if (!$row.length) {
            return null;
        }
        var $label = $row.find('td.label label').first();

        return $label.length ? $label : $row.find('td.label').first();
    }

    function addMarker(elementId, block) {
        var $target = labelTargetFor(elementId);

        if (!$target || !$target.length || $target.find('.mosdoc-marker').length) {
            return;
        }

        var $marker = $('<button/>', {
            type: 'button',
            'class': 'mosdoc-marker',
            'aria-label': $t('Documentation for this setting'),
            'aria-expanded': 'false',
            title: $t('Documentation for this setting')
        }).data('mosdocKey', elementId);

        $marker.on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (state.open === elementId) {
                closePopover();
            } else {
                openPopover($marker, block);
            }
        });

        $target.append($marker);
    }

    return function (config) {
        $(function () {
            var elementIds = $('tr[id^="row_"]')
                .map(function () { return this.id.substring(4); })
                .get()
                .filter(Boolean);

            if (!elementIds.length || !config.fetchUrl) {
                return;
            }

            $.ajax({
                url: config.fetchUrl,
                type: 'POST',
                dataType: 'json',
                data: { elements: elementIds, form_key: window.FORM_KEY },
                // A documentation aid must never block or break the screen it decorates.
                global: false
            }).done(function (response) {
                var blocks = (response && response.blocks) || {};

                Object.keys(blocks).forEach(function (elementId) {
                    addMarker(elementId, blocks[elementId]);
                });
            });

            $(document).on('click', function (e) {
                if (state.popover && !$(e.target).closest('.mosdoc-popover, .mosdoc-marker').length) {
                    closePopover();
                }
            });
            $(document).on('keydown', function (e) {
                if (e.key === 'Escape' && state.popover) {
                    closePopover();
                    if (state.anchor) { state.anchor.trigger('focus'); }
                }
            });
            $(window).on('resize scroll', function () {
                if (state.popover && state.anchor) { place(state.popover, state.anchor); }
            });
        });
    };
});
