/**
 * Lia Widget Embed Script
 * Iframe-based widget loader for safe, isolated embedding
 */

(function () {
  'use strict';

  try {
    var SCRIPT_ID = 'lia-widget-embed-script';
    var EXISTING = document.getElementById(SCRIPT_ID);
    if (EXISTING) return;

    var currentScript = document.currentScript || (function () {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();
    if (currentScript) currentScript.id = SCRIPT_ID;

    function getAttr(name, fallback) {
      if (!currentScript) return fallback;
      var value = currentScript.getAttribute(name);
      return (value && value.trim()) || fallback;
    }

    function parseBaseUrl() {
      var explicit = getAttr('data-base-url', '');
      if (explicit) return explicit.replace(/\/$/, '');
      
      // For local development
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000';
      }
      
      if (!currentScript || !currentScript.src) return window.location.origin;
      try {
        var url = new URL(currentScript.src, window.location.href);
        return url.origin;
      } catch (_) {
        return window.location.origin;
      }
    }

    function createIframe(src) {
      var iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.style.position = 'absolute';
      iframe.style.top = '0';
      iframe.style.left = '0';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = '0';
      iframe.style.borderRadius = '0';
      iframe.style.zIndex = '1';
      iframe.style.background = 'transparent';
      iframe.style.pointerEvents = 'auto';
      iframe.style.boxShadow = 'none';
      iframe.setAttribute('title', 'Lia AI Widget');
      iframe.allow = 'microphone; autoplay; encrypted-media';
      iframe.allowFullscreen = false;
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      return iframe;
    }

    function ensureContainer(position) {
      var containerId = 'lia-widget-container';
      var container = document.getElementById(containerId);
      if (container) return container;
      
      container = document.createElement('div');
      container.id = containerId;
      container.style.all = 'initial';
      container.style.position = 'fixed';
      
      // Apply initial position based on config
      var positionStyles = getPositionStyles(position || 'bottom-right', '1rem');
      Object.keys(positionStyles).forEach(function(key) {
        container.style[key] = positionStyles[key];
      });
      
      container.style.zIndex = '2147483647';
      container.style.width = '24rem';  // 20rem + 1rem
      container.style.height = '12rem'; // Increased significantly for full content
      container.style.pointerEvents = 'none'; // Allow clicks to pass through
      container.style.background = 'transparent';
      container.style.border = 'none';
      container.style.padding = '0';
      container.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      container.style.overflow = 'visible';
      
      document.body.appendChild(container);
      return container;
    }
    
    // Helper function to add extra space to a dimension string
    function addExtraSpace(dimension, extraRem) {
      if (!dimension || dimension === 'none' || dimension === 'auto') return dimension;
      
      // Handle calc() expressions
      if (dimension.includes('calc(')) {
        return 'calc(' + dimension.replace('calc(', '').replace(')', '') + ' + ' + extraRem + 'rem)';
      }
      
      // Handle rem values
      if (dimension.endsWith('rem')) {
        var value = parseFloat(dimension);
        return (value + extraRem) + 'rem';
      }
      
      // Handle vh values
      if (dimension.endsWith('vh')) {
        return 'calc(' + dimension + ' + ' + extraRem + 'rem)';
      }
      
      // Handle px values
      if (dimension.endsWith('px')) {
        var pxValue = parseFloat(dimension);
        return (pxValue + (extraRem * 16)) + 'px'; // Assuming 1rem = 16px
      }
      
      return dimension;
    }
    
    // Helper function to add 1rem to a dimension string
    function addOneRem(dimension) {
      return addExtraSpace(dimension, 1);
    }
    
    // Helper function to add 2rem to a dimension string (for height)
    function addTwoRem(dimension) {
      return addExtraSpace(dimension, 2);
    }
    
    // Helper function to add 4rem to a dimension string (for full height)
    function addFourRem(dimension) {
      return addExtraSpace(dimension, 4);
    }
    
    // Helper function to get position styles with mobile responsiveness
    function getPositionStyles(position, padding) {
      // Detect mobile screen size
      var isMobile = window.innerWidth <= 768;
      var isSmallMobile = window.innerWidth <= 480;
      
      // Adjust padding for mobile devices
      var mobilePadding = isSmallMobile ? '0.5rem' : (isMobile ? '0.75rem' : padding);
      
      // Reset all position values first
      var styles = {
        top: 'auto',
        bottom: 'auto',
        left: 'auto',
        right: 'auto'
      };
      
      // Apply position-specific styles
      switch(position) {
        case 'bottom-right':
          styles.bottom = mobilePadding;
          styles.right = mobilePadding;
          break;
        case 'bottom-left':
          styles.bottom = mobilePadding;
          styles.left = mobilePadding;
          break;
        case 'top-right':
          styles.top = mobilePadding;
          styles.right = mobilePadding;
          break;
        case 'top-left':
          styles.top = mobilePadding;
          styles.left = mobilePadding;
          break;
        default:
          styles.bottom = mobilePadding;
          styles.right = mobilePadding;
      }
      
      return styles;
    }

    function init() {
      var base = parseBaseUrl();
      var assistantId = getAttr('data-assistant-id', '');
      var mode = getAttr('data-mode', 'both');
      var agentDisplayName = getAttr('data-agent-display-name', 'Lia');
      var serverUrl = getAttr('data-server-url', '');
      var theme = getAttr('data-theme', 'light');
      var position = getAttr('data-position', 'bottom-right');
      var size = getAttr('data-size', 'full');
      var borderRadius = getAttr('data-border-radius', 'large');
      var baseBgColor = getAttr('data-base-bg-color', '#ffffff');
      var accentColor = getAttr('data-accent-color', '#9333ea');
      var ctaButtonColor = getAttr('data-cta-button-color', '#000000');
      var ctaButtonTextColor = getAttr('data-cta-button-text-color', '#ffffff');
      var title = getAttr('data-title', 'TALK WITH AI');
      var startButtonText = getAttr('data-start-button-text', 'Start');
      var endButtonText = getAttr('data-end-button-text', 'End Call');
      var chatFirstMessage = getAttr('data-chat-first-message', 'Hey, How can I help you today?');
      var chatPlaceholder = getAttr('data-chat-placeholder', 'Type your message...');
      var voiceShowTranscript = getAttr('data-voice-show-transcript', 'true');
      var consentRequired = getAttr('data-consent-required', 'true');
      var consentTitle = getAttr('data-consent-title', 'Terms and conditions');
      var consentContent = getAttr('data-consent-content', '');
      var consentStorageKey = getAttr('data-consent-storage-key', 'lia_widget_consent');
      var customImageUrl = getAttr('data-custom-image-url', '');
      var helpTexts = getAttr('data-help-texts', '');
      var languageSelectorEnabled = getAttr('data-language-selector-enabled', 'false');
      var languages = getAttr('data-languages', '[]');
      
      if (!assistantId) {
        console.error('[Lia Widget] data-assistant-id is required');
        return;
      }

      var url = base + '/widget-iframe';
      var params = new URLSearchParams();
      
      params.set('assistantId', assistantId);
      params.set('mode', mode);
      params.set('agentDisplayName', agentDisplayName);
      params.set('serverUrl', serverUrl);
      params.set('theme', theme);
      params.set('position', position);
      params.set('size', size);
      params.set('borderRadius', borderRadius);
      params.set('baseBgColor', encodeURIComponent(baseBgColor));
      params.set('accentColor', encodeURIComponent(accentColor));
      params.set('ctaButtonColor', encodeURIComponent(ctaButtonColor));
      params.set('ctaButtonTextColor', encodeURIComponent(ctaButtonTextColor));
      params.set('title', encodeURIComponent(title));
      params.set('startButtonText', encodeURIComponent(startButtonText));
      params.set('endButtonText', encodeURIComponent(endButtonText));
      params.set('chatFirstMessage', encodeURIComponent(chatFirstMessage));
      params.set('chatPlaceholder', encodeURIComponent(chatPlaceholder));
      params.set('voiceShowTranscript', voiceShowTranscript);
      params.set('consentRequired', consentRequired);
      params.set('consentTitle', encodeURIComponent(consentTitle));
      if (consentContent) {
        params.set('consentContent', encodeURIComponent(consentContent));
      }
      params.set('consentStorageKey', consentStorageKey);
      if (customImageUrl) {
        params.set('customImageUrl', encodeURIComponent(customImageUrl));
      }
      if (helpTexts) {
        params.set('helpTexts', encodeURIComponent(helpTexts));
      }
      params.set('languageSelectorEnabled', languageSelectorEnabled);
      if (languages) {
        params.set('languages', encodeURIComponent(languages));
      }
      
      url += '?' + params.toString();

      var container = ensureContainer(position);
      var iframe = createIframe(url);
      container.appendChild(iframe);

      // Track widget state from messages
      var isWidgetOpen = false;
      
      function handleWidgetMessage(event) {
        // Only accept messages from our iframe
        if (event.source !== iframe.contentWindow) return;
        
        if (event.data && event.data.type === 'lia-widget-state') {
          var isOpen = event.data.isOpen;
          isWidgetOpen = isOpen; // Update tracked state
          
          var dimensions = event.data.dimensions || {};
          var position = event.data.position || 'bottom-right';
          var borderRadius = event.data.borderRadius || 'large';
          
          // Map border radius to CSS values
          var borderRadiusMap = {
            'none': '0',
            'small': '0.5rem',
            'medium': '1rem',
            'large': '1.5rem'
          };
          var radius = borderRadiusMap[borderRadius] || borderRadiusMap['large'];
          
          // Apply position-based styles - SAME for both open and closed
          var positionStyles = getPositionStyles(position, '1rem');
          Object.keys(positionStyles).forEach(function(key) {
            container.style[key] = positionStyles[key];
          });
          
          // Detect mobile screen size for responsive dimensions
          var isMobile = window.innerWidth <= 768;
          var isSmallMobile = window.innerWidth <= 480;
          
          if (isOpen) {
            // Widget is open - expand and make visible with enough space
            var width = dimensions.width || '26rem';
            var height ="90vh";
            var maxHeight = '90vh';
            
            // Adjust dimensions for mobile
            if (isSmallMobile) {
              width = 'calc(100vw - 1rem)';
              height = 'calc(100vh - 2rem)';
              maxHeight = 'calc(100vh - 2rem)';
            } else if (isMobile) {
              width = 'calc(100vw - 1.5rem)';
              height = 'calc(100vh - 3rem)';
              maxHeight = 'calc(100vh - 3rem)';
            }
            
            // Add extra space to container: 1rem for width, 4rem for height (full visibility)
            container.style.width = addOneRem(width);
            container.style.height = "90vh"
            container.style.maxHeight = "90vh"
            container.style.pointerEvents = 'auto'; // Block clicks only on widget area
            container.style.borderRadius = radius;
            container.style.border = 'none';
            
            iframe.style.borderRadius = radius;
            
            // Add outside click listener when widget opens
            setTimeout(function() {
              document.addEventListener('click', handleOutsideClick);
            }, 100);
          } else {
            // Widget is closed - collapse and make transparent/invisible
            var collapsedWidth = dimensions.collapsedWidth || '20rem';
            var collapsedHeight = dimensions.collapsedHeight || '13rem';
            
            // Adjust collapsed dimensions for mobile
            if (isSmallMobile) {
              collapsedWidth = '16rem';
              collapsedHeight = '12rem';
            } else if (isMobile) {
              collapsedWidth = '18rem';
              collapsedHeight = '13rem';
            }
            
            // Add extra space to container: 1rem for width, 4rem for height (full visibility)
            container.style.width = addOneRem(collapsedWidth);
            container.style.height = "50rem"
            container.style.maxHeight = 'none';
            container.style.pointerEvents = 'none'; // Allow clicks to pass through
            container.style.borderRadius = radius;
            container.style.border = 'none';
            
            iframe.style.borderRadius = radius;
            
            // Remove outside click listener when widget closes
            document.removeEventListener('click', handleOutsideClick);
          }
        }
      }
      
      window.addEventListener('message', handleWidgetMessage);

      // Handle clicks outside the widget to close it
      function handleOutsideClick(event) {
        // Only handle clicks when widget is open
        if (!isWidgetOpen) return;
        
        // Check if click is outside the container
        if (!container.contains(event.target)) {
          // Tell the iframe to close the widget
          iframe.contentWindow.postMessage({ type: 'lia-widget-close' }, '*');
        }
      }

      // Expose control API
      window.LiaWidget = window.LiaWidget || {};
      window.LiaWidget.open = function () {
        iframe.contentWindow.postMessage({ type: 'lia-widget-open' }, '*');
      };
      window.LiaWidget.close = function () {
        iframe.contentWindow.postMessage({ type: 'lia-widget-close' }, '*');
      };
      window.LiaWidget.toggle = function () {
        iframe.contentWindow.postMessage({ type: 'lia-widget-toggle' }, '*');
      };
      window.LiaWidget.destroy = function () {
        window.removeEventListener('message', handleWidgetMessage);
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      };
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  } catch (e) {
    console.error('[Lia Widget] Initialization error:', e);
  }
})();

