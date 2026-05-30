import { useRef } from 'react'

// Фиксированная нижняя панель с кнопкой съёмки.
// capture="environment" открывает заднюю камеру на телефоне.
export default function BottomBar({ onPhoto }) {
  const inputRef = useRef(null)

  function onChange(e) {
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
