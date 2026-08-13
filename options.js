let statusTimeout;

function showStatus(success, message) {
  const status = document.getElementById('status');
  const icon = status.querySelector('.status-icon');
  const text = status.querySelector('.status-text');
  if (success) {
    status.classList.remove('error');
    icon.textContent = '✓';
    text.textContent = 'Saved successfully';
  } else {
    status.classList.add('error');
    icon.textContent = '✗';
    text.textContent = message || 'Save failed';
  }
  status.classList.add('visible');
  clearTimeout(statusTimeout);
  statusTimeout = setTimeout(() => {
    status.classList.remove('visible');
  }, 2500);
}

function saveOptions() {
  const prompt = document.getElementById('prompt').value;
  browser.storage.local
    .set({
      promptText: prompt,
    })
    .then(() => {
      showStatus(true);
    })
    .catch(err => {
      console.error('Quick YouTube Summary with Gemini: Failed to save options.', err);
      showStatus(false, 'Save failed');
    });
}

function restoreOptions() {
  browser.storage.local
    .get({
      promptText: defaultPromptText,
    })
    .then(result => {
      document.getElementById('prompt').value = result.promptText;
    });
}

function resetOptions() {
  document.getElementById('prompt').value = defaultPromptText;
  saveOptions();
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('reset').addEventListener('click', resetOptions);
