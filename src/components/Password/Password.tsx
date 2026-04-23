import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "./password.css"

const STORED_HASH =
"150209"

type PopupProps = {
  onClose: () => void
  onSuccess?: () => void
}

export default function Password({ onClose, onSuccess }: PopupProps) {

  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleLogin = async () => {


    if (password === STORED_HASH) {

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