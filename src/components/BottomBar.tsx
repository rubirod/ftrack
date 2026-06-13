import { useRef, type ChangeEvent } from 'react'

// Фиксированная нижняя панель с кнопкой съёмки.
// capture="environment" открывает заднюю камеру на телефоне.
export default function BottomBar({ onPhoto }: { onPhoto: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // позволяет выбрать тот же файл повторно
    if (file) onPhoto(file)
  }

  return (
    <div className="bottombar">
      <button className="shoot" onClick={() => inputRef.current?.click()}>
        📷 Сфотографировать
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={onChange}
      />
    </div>
  )
}
