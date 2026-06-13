import { useStore } from '../state/store'

export default function Toast() {
  const { toast } = useStore()
  if (!toast) return null
  return <div className="toast">{toast}</div>
}
