import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "./password.css"

const STORED_HASH =
"89f2ab9c6cede4bbee15778e1820a0a5404e67447094699c4380eabc82003e4f"

type PopupProps = {
  onClose: () => void
  onSuccess?: () => void
}

async function hashPassword(password: string) {

  const encoder = new TextEncoder()
  const data = encoder.encode(password)

  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))

  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

export default function Password({ onClose, onSuccess }: PopupProps) {

  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleLogin = async () => {

    const inputHash = await hashPassword(password)

    if (inputHash === STORED_HASH) {

      if (onSuccess) {
        onSuccess()
      } else {
        navigate("/Dashboard")
      }

      onClose()

    } else {
      setError("Senha incorreta. Tente novamente.")
    }
  }

  useEffect(() => {

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleEsc)

    return () => {
      window.removeEventListener("keydown", handleEsc)
    }

  }, [onClose])

  return (
   <div id="bg-password">

  <div
    id="container-password"
    onClick={(e) => e.stopPropagation()}
  >

    <div id="header-password">

      <text>Insira sua senha:</text>

      <button id="close-btn" onClick={onClose}>
        ✕
      </button>

    </div>

    <input
      id="text-password"
      type="password"
      placeholder="Insira sua senha aqui:"
      autoFocus
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />

    <button id="enter-btn" onClick={handleLogin}>
      Entrar
    </button>

    {error && <p>{error}</p>}

  </div>

</div>
  )
}