if (!window.geminiSummarizerInjected) {
  window.geminiSummarizerInjected = true;
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Respond to ping — background uses this to check if listener is alive before re-injecting.
    // Prevents silent failure when user triggers summarization on an already-open Gemini tab.
    if (message.action === "ping") {
      sendResponse({ ok: true });
      return false;
    }

    if (message.action === "pasteUrlToActiveElement" && message.textToPaste) {
      let attempts = 0;
      const maxAttempts = 50; // 50 * 200ms = 10 seconds
      let intervalId = null;
      let buttonIntervalId = null;

      const cleanup = () => {
        clearInterval(intervalId);
        clearInterval(buttonIntervalId);
        document.removeEventListener('visibilitychange', onHide);
      };

      // Abort polling if tab navigates away mid-injection
      const onHide = () => {
        if (document.hidden) cleanup();
      };
      document.addEventListener('visibilitychange', onHide);

      intervalId = setInterval(() => {
        attempts++;

        // Try to find Gemini's input box using various potential selectors
        const inputElement = document.querySelector(
          'rich-textarea div[contenteditable="true"], ' +
          'div.ql-editor, ' +
          'div[contenteditable="true"][aria-label*="prompt"], ' +
          'div[contenteditable="true"][data-placeholder], ' +
          'textarea' // fallback
        );

        if (inputElement) {
          clearInterval(intervalId);

          inputElement.focus();
          // Select all existing content via Range API (replaces deprecated execCommand selectAll)
          const contentRange = document.createRange();
          contentRange.selectNodeContents(inputElement);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(contentRange);
          // execCommand insertText is deprecated but remains the most reliable way
          // to trigger updates in framework-managed contenteditable elements (React, Lit, etc.)
          document.execCommand('insertText', false, message.textToPaste);
          inputElement.dispatchEvent(new Event('input', { bubbles: true }));

          let buttonAttempts = 0;
          buttonIntervalId = setInterval(() => {
            buttonAttempts++;
            const sendButton = document.querySelector(
              'button[aria-label*="Send"], ' +
              'button[aria-label*="Submit"], ' +
              'button.send-button'
            );

            if (sendButton && !sendButton.disabled) {
              cleanup();
              sendButton.click();
              sendResponse({ success: true, method: "button_click" });
            } else if (buttonAttempts >= 15) { // 3 seconds timeout
              cleanup();
              // Fallback to simulating Enter (keyCode/which omitted — deprecated, key: 'Enter' sufficient)
              inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true, composed: true }));
              inputElement.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true, composed: true }));
              sendResponse({ success: true, method: "enter_key" });
            }
          }, 200);
        } else if (attempts >= maxAttempts) {
          cleanup();
          sendResponse({ success: false, reason: "Timeout: Could not find input element after 10 seconds." });
        }
      }, 200);

      return true; // Indicates asynchronous response
    }
    return false;
  });
}
