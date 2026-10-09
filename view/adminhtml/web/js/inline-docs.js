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
 * the generator recorded. A lookup, not a guess. Everything is one request per page.
 *
 * What a marker opens is a small documentation card: the field's own label as the
 * heading (read from the page, not duplicated in the data), the admin path as a
 * pill, a one-line summary, a longer usage body, the accepted values, the technical
 * facts, and a footer naming the owning module. Fields with nothing written about
 * them get no marker, which is the intended outcome rather than a gap.
 */
define(['jquery', 'mage/translate'], function ($, $t) {
    'use strict';

    var POPOVER_WIDTH = 380,
        VIEWPORT_MARGIN = 12,
        OPEN_DELAY = 120,   // settle before opening, so skimming past a marker doesn't flash it
        CLOSE_DELAY = 220,  // grace to cross the gap from marker into the popover
        state = { open: null, popover: null, anchor: null, pinned: false, openTimer: null, closeTimer: null };

    // Inline formatting a <usage> body may use. Anything else is dropped, so a note
    // shipped by any module can never inject script, styles, or layout-breaking markup.
    var ALLOWED_TAGS = {
            P: [], BR: [], UL: [], OL: [], LI: [], CODE: [], STRONG: [], EM: [], B: [], I: [],
            A: ['href']
        };

    /** Escape plain text for safe insertion as HTML. */
    function escapeHtml(src) {
        return String(src)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /**
     * Rebuild an HTML fragment keeping only whitelisted inline tags/attributes.
     * Parsing into a detached document means no network or script runs; we then
     * clone across only the nodes we trust. Returns a DocumentFragment.
     */
    function sanitizeHtml(src) {
        var parsed = new DOMParser().parseFromString('<div>' + String(src) + '</div>', 'text/html'),
            root = parsed.body.firstChild,
            frag = document.createDocumentFragment();

        function clean(source, dest) {
            Array.prototype.forEach.call(source.childNodes, function (node) {
                if (node.nodeType === 3) { // text
                    dest.appendChild(document.createTextNode(node.nodeValue));
                    return;
                }
                if (node.nodeType !== 1) {
                    return;
                }
                var allowed = ALLOWED_TAGS[node.nodeName];
                if (!allowed) {
                    // Drop the tag but keep its (cleaned) contents.
                    clean(node, dest);
                    return;
                }
                var el = document.createElement(node.nodeName.toLowerCase());
                allowed.forEach(function (attr) {
                    var value = node.getAttribute(attr);
                    if (attr === 'href') {
                        if (value && /^https?:\/\//i.test(value)) {
                            el.setAttribute('href', value);
                            el.setAttribute('target', '_blank');
                            el.setAttribute('rel', 'noopener noreferrer');
                        }
                    } else if (value !== null) {
                        el.setAttribute(attr, value);
                    }
                });
                clean(node, el);
                dest.appendChild(el);
            });
        }

        if (root) {
            clean(root, frag);
        }

        return frag;
    }

    /** A documentation section with a small heading, used for values and technical. */
    function buildSection(title) {
        return $('<div class="mosdoc-popover__section"/>')
            .append($('<h4 class="mosdoc-popover__section-title"/>').text(title));
    }

    function buildValues(values) {
        var $section = buildSection($t('Accepted values')),
            $list = $('<ul class="mosdoc-popover__values"/>');

        values.forEach(function (value) {
            var $item = $('<li/>');
            $('<code class="mosdoc-popover__value-id"/>').text(value.id).appendTo($item);
            $('<span class="mosdoc-popover__value-label"/>').text(value.label).appendTo($item);
            if (value.description) {
                $('<span class="mosdoc-popover__value-desc"/>').text(value.description).appendTo($item);
            }
            $list.append($item);
        });

        return $section.append($list);
    }

    function buildTechnical(rows) {
        var $section = buildSection($t('Technical details')),
            $list = $('<dl class="mosdoc-popover__technical"/>');

        rows.forEach(function (row) {
            $('<dt/>').text(row.label).appendTo($list);
            $('<dd/>').text(row.value).appendTo($list);
        });

        return $section.append($list);
    }

    /** Assemble the card for one field into the popover body/foot. */
    function renderCard($popover, block, title, showDocLink) {
        var $header = $('<div class="mosdoc-popover__header"/>');
        if (title) {
            $('<h3 class="mosdoc-popover__title"/>').text(title).appendTo($header);
        }
        if (block.path) {
            $('<code class="mosdoc-popover__path"/>').text(block.path).appendTo($header);
        }

        var $body = $('<div class="mosdoc-popover__body"/>');
        if (block.summary) {
            $('<p class="mosdoc-popover__summary"/>').text(block.summary).appendTo($body);
        }
        if (block.usage) {
            $('<div class="mosdoc-popover__usage"/>').append(sanitizeHtml(block.usage)).appendTo($body);
        }
        if (block.values && block.values.length) {
            $body.append(buildValues(block.values));
        }
        if (block.technical && block.technical.length) {
            $body.append(buildTechnical(block.technical));
        }

        var $foot = $('<div class="mosdoc-popover__foot"/>')
            .append($('<span class="mosdoc-popover__module"/>').text(block.moduleName || block.title || ''));
        if (showDocLink && block.url) {
            $('<a/>', {
                'class': 'mosdoc-popover__link',
                href: block.url,
                target: '_blank',
                rel: 'noopener noreferrer',
                text: $t('Full Documentation')
            }).appendTo($foot);
        }

        $popover.empty()
            .append('<span class="mosdoc-popover__arrow"></span>')
            .append($header)
            .append($body)
            .append($foot);
    }

    function cancelOpen() {
        if (state.openTimer) { window.clearTimeout(state.openTimer); state.openTimer = null; }
    }

    function cancelClose() {
        if (state.closeTimer) { window.clearTimeout(state.closeTimer); state.closeTimer = null; }
    }

    /** Close after a short grace period, unless pinned open by a click. */
    function scheduleClose() {
        if (state.pinned) {
            return;
        }
        cancelClose();
        state.closeTimer = window.setTimeout(function () {
            state.closeTimer = null;
            closePopover();
        }, CLOSE_DELAY);
    }

    function closePopover() {
        cancelOpen();
        cancelClose();
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
        state.pinned = false;
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
        top = Math.max(VIEWPORT_MARGIN, top);

        $popover
            .css({ width: width + 'px', left: Math.round(left) + 'px', top: Math.round(top) + 'px' })
            .toggleClass('mosdoc-popover--above', flipped)
            .find('.mosdoc-popover__arrow')
            .css('left', Math.round(rect.left + rect.width / 2 - left) + 'px');
    }

    function openPopover($anchor, block, title, showDocLink, pinned) {
        closePopover();

        var $popover = $('<div class="mosdoc-popover" role="dialog" aria-modal="false"/>');
        renderCard($popover, block, title, showDocLink);

        // Keep it open while the pointer is over the card (to scroll or reach the
        // link); leaving the card schedules the same graceful close as the marker.
        $popover
            .on('mouseenter', cancelClose)
            .on('mouseleave', scheduleClose);

        $('body').append($popover);
        place($popover, $anchor);
        window.requestAnimationFrame(function () { $popover.addClass('mosdoc-popover--visible'); });

        $anchor.attr('aria-expanded', 'true').addClass('mosdoc-marker--active');
        state.popover = $popover;
        state.anchor = $anchor;
        state.open = $anchor.data('mosdocKey');
        state.pinned = Boolean(pinned);
    }

    /** The label cell of a config row, which is where the marker belongs. */
    function labelTargetFor(elementId) {
        var $row = $(document.getElementById('row_' + elementId));

        if (!$row.length) {
            return null;
        }
        var $label = $row.find('td.label label').first();

        if ($label.length) {
            // The field name sits in a <span> that carries the [SCOPE] indicator
            // as a CSS ::after (rendered below the text). Append the marker INSIDE
            // that span — after the text, before the ::after — so it stays inline
            // with the label and never gets pushed below the scope line.
            var $span = $label.find('span[data-config-scope]').first();
            if (!$span.length) {
                $span = $label.find('span').first();
            }
            return $span.length ? $span : $label;
        }

        return $row.find('td.label').first();
    }

    /** The field's own label text, reused as the card heading. */
    function readRowLabel(elementId) {
        var $label = $(document.getElementById('row_' + elementId)).find('td.label label').first();

        return $label.length ? $label.text().trim() : '';
    }

    function addMarker(elementId, block, showDocLink) {
        var $target = labelTargetFor(elementId);

        if (!$target || !$target.length || $target.find('.mosdoc-marker').length) {
            return;
        }

        var title = readRowLabel(elementId);

        var $marker = $('<button/>', {
            type: 'button',
            'class': 'mosdoc-marker',
            'aria-label': title ? $t('Documentation for') + ' ' + title : $t('Documentation for this setting'),
            'aria-expanded': 'false',
            title: $t('Documentation for this setting')
        }).data('mosdocKey', elementId);

        // Hover opens the card (after a short settle); leaving marker or card closes it.
        $marker.on('mouseenter', function () {
            cancelClose();
            if (state.open === elementId) {
                return;
            }
            cancelOpen();
            state.openTimer = window.setTimeout(function () {
                state.openTimer = null;
                openPopover($marker, block, title, showDocLink, false);
            }, OPEN_DELAY);
        });

        $marker.on('mouseleave', function () {
            cancelOpen();
            scheduleClose();
        });

        // Click pins it open (so it stays while you scroll or click the link);
        // clicking the same marker again dismisses it. Also covers keyboard/tap.
        $marker.on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            cancelOpen();

            if (state.open === elementId && state.pinned) {
                closePopover();
            } else {
                openPopover($marker, block, title, showDocLink, true);
            }
        });

        // Keyboard focus only. A pointer focuses the marker on mousedown, which
        // would otherwise open a moment before the click handler toggles it.
        $marker.on('focus', function () {
            var keyboard = false;
            try { keyboard = $marker.is(':focus-visible'); } catch (e) { keyboard = false; }
            if (keyboard && state.open !== elementId) {
                openPopover($marker, block, title, showDocLink, true);
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
                    addMarker(elementId, blocks[elementId], config.showDocLink);
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
