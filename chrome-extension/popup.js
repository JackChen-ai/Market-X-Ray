// Market X-Ray Popup Script

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const toggleEnabled = document.getElementById('toggleEnabled')
  const toggleAutoScan = document.getElementById('toggleAutoScan')
  const statusDot = document.getElementById('statusDot')
  const statusText = document.getElementById('statusText')
  const testTicker = document.getElementById('testTicker')
  const testButton = document.getElementById('testButton')
  const testResult = document.getElementById('testResult')
  const settingsButton = document.getElementById('settingsButton')
  const privacyLink = document.getElementById('privacyLink')
  const helpLink = document.getElementById('helpLink')

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

  // Test max pain calculation
  testButton.addEventListener('click', () => {
    const ticker = testTicker.value.trim().toUpperCase()
    if (!ticker) {
      showTestResult('Please enter a ticker symbol', 'error')
      return
    }

    testButton.disabled = true
    testButton.textContent = 'Calculating...'
    testResult.classList.remove('show')

    chrome.runtime.sendMessage(
      { type: 'FETCH_MAX_PAIN', ticker },
      (response) => {
        testButton.disabled = false
        testButton.textContent = 'Test Max Pain Calculation'

        if (response && response.success) {
          const data = response.data
          showTestResult(`
            <strong>$${ticker}</strong><br>
            Current Price: $${data.underlyingPrice?.toFixed(2) || 'N/A'}<br>
            Max Pain: $${data.maxPain?.toFixed(2) || 'N/A'}<br>
            Difference: ${data.analysis?.difference ? data.analysis.difference.toFixed(2) : 'N/A'} (${data.analysis?.percentageDiff || 'N/A'}%)<br>
            <br>
            <em>${data.analysis?.analysis || 'No analysis available'}</em>
          `, 'success')
        } else {
          showTestResult(
            `Error: ${response?.error || 'Failed to fetch data'}`,
            'error'
          )
        }
      }
    )
  })

  // Settings button
  settingsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage()
  })

  // Privacy link
  privacyLink.addEventListener('click', (e) => {
    e.preventDefault()
    chrome.tabs.create({ url: 'https://github.com/your-username/market-x-ray/wiki/Privacy-Policy' })
  })

  // Help link
  helpLink.addEventListener('click', (e) => {
    e.preventDefault()
    chrome.tabs.create({ url: 'https://github.com/your-username/market-x-ray/wiki/Help' })
  })

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

  function showTestResult(message, type) {
    testResult.innerHTML = message
    testResult.className = 'test-result show'
    testResult.style.background = type === 'error' ? '#fee7e7' : '#e8f5fe'
    testResult.style.color = type === 'error' ? '#e0245e' : '#1da1f2'
  }

  // Handle Enter key in test input
  testTicker.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      testButton.click()
    }
  })
})