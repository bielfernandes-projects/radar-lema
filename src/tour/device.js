// Celular (iPhone/iPad/Android): so la o passo de instalacao faz sentido.
export function isPhoneDevice() {
  return /iphone|ipad|ipod|android/i.test(navigator.userAgent)
}
