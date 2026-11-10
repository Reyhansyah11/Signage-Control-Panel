const form = document.getElementById('form')
const appUrl = document.getElementById('appUrl')
const deviceId = document.getElementById('deviceId')
const autoStart = document.getElementById('autoStart')
const errorBox = document.getElementById('error')
const cancel = document.getElementById('cancel')
const submit = document.getElementById('submit')

function showError(message) {
  errorBox.textContent = message
  errorBox.hidden = false
}

// Bila sudah pernah dikonfigurasi, isian terisi dan tombol Batal tersedia.
void window.signageSetup.getConfig().then((config) => {
  if (!config) return
  appUrl.value = config.appUrl
  deviceId.value = config.deviceId
  autoStart.checked = config.autoStart
  cancel.hidden = false
})

cancel.addEventListener('click', () => void window.signageSetup.cancel())

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  errorBox.hidden = true
  submit.disabled = true
  const result = await window.signageSetup.save({
    appUrl: appUrl.value,
    deviceId: deviceId.value,
    autoStart: autoStart.checked,
  })
  // Bila berhasil, jendela langsung berpindah ke halaman pemutar.
  if (!result.ok) {
    showError(result.error)
    submit.disabled = false
  }
})
