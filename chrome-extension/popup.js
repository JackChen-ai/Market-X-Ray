// Market X-Ray Popup Script

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const toggleEnabled = document.getElementById('toggleEnabled')
  const toggleAutoScan = document.getElementById('toggleAutoScan')
  const statusDot = document.getElementById('statusDot')
  const statusText = document.getElementById('statusText')
  const privacyLink = document.getElementById('privacyLink')

  // Load current state
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
    if (response) {
      toggleEnabled.checked = response.isEnabled
      toggleAutoScan.checked = response.userPreferences.autoScan
      updateStatus(response.isEnabled)
    }
  })

  // Toggle extension enabled state
  toggleEnabled.addEventListener('change', () => {
    const enabled = toggleEnabled.checked
    chrome.runtime.sendMessage(
      { type: 'TOGGLE_ENABLED', enabled },
      (response) => {
        if (response && response.success) {
          updateStatus(enabled)
        }
      }
    )
  })

  // Toggle auto-scan
  toggleAutoScan.addEventListener('change', () => {
    chrome.runtime.sendMessage({
      type: 'UPDATE_PREFERENCES',
      preferences: { autoScan: toggleAutoScan.checked },
    })
  })


  // Privacy link
  privacyLink.addEventListener('click', (e) => {
    e.preventDefault()
    chrome.tabs.create({ url: chrome.runtime.getURL('privacy-policy.html') })
  })

  // Discord button
  const discordButton = document.getElementById('discordButton')
  if (discordButton) {
    discordButton.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://discord.gg/FHvSUTUuMU' })
    })
  }

  // Helper functions
  function updateStatus(enabled) {
    if (enabled) {
      statusDot.style.background = '#17bf63'
      statusText.textContent = 'Extension is enabled'
      statusText.style.color = '#1da1f2'
    } else {
      statusDot.style.background = '#e0245e'
      statusText.textContent = 'Extension is disabled'
      statusText.style.color = '#657786'
    }
  }

})