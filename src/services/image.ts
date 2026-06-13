// Готовит фото к отправке в Anthropic: ресайз + переэнкод в JPEG.
// Это решает сразу две проблемы iPhone:
//  - HEIC из «Библиотеки» (canvas рендерит, а на выходе всегда JPEG);
//  - вес 3–5 МБ (ужимаем до ~1568px по длинной стороне).
const MAX_DIM = 1568
const QUALITY = 0.8

export interface PreparedImage {
  base64: string
  previewUrl: string
}

export function fileToJpegBase64(file: File): Promise<PreparedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      const scale = Math.min(1, MAX_DIM / Math.max(width, height))
      width = Math.round(width * scale)
      height = Math.round(height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas не поддерживается'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)

      const dataUrl = canvas.toDataURL('image/jpeg', QUALITY)
      // base64 без префикса data:image/...;base64,
      const base64 = dataUrl.split(',')[1]
      resolve({ base64, previewUrl: dataUrl })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Не удалось прочитать изображение'))
    }
    img.src = url
  })
}
