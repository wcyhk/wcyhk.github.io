// Fixed automatic entry; paint the lightweight welcome before navigation.
// No credentials, API requests, third-party scripts or query-string destination.
let moving = false
const go = () => {
  if (moving) return
  moving = true
  window.location.replace('https://neighbour-yuenhk-live.onrender.com/')
}
requestAnimationFrame(() => requestAnimationFrame(go))
// Background tabs can pause animation frames. Keep automatic navigation bounded.
setTimeout(go, 120)
