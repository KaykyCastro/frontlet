import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeftIcon } from "@phosphor-icons/react"
import { type User } from "../types"
import "./fiado.css"

export default function Fiado() {

    const navigate = useNavigate()

    function handleGoBack() {
        navigate("/Vendas")
    }

    //Listagem
    const [clientes, setClientes] = useState<User[]>([])
    const [searchText, setSearchText] = useState("")

    //Cadastro cliente
    //Cadastro cliente
    const [nameRegister, setNameRegister] = useState("")
    const [cpfRegister, setCpfRegister] = useState("")
    const [telefoneRegister, setTelefoneRegister] = useState("")
    const [enderecoRegister, setEnderecoRegister] = useState("")

    useEffect(() => {
        buscarClientes()
    }, [])

    async function buscarClientes() {
        const response = await fetch("http://localhost:3000/usuarios")
        const data = await response.json()
        setClientes(data)
    }

    function selecionarCliente(cliente: User) {
        navigate("/Clientes/Cliente", { state: { cliente } })
    }

    async function registrarCliente(e: React.MouseEvent) {
        e.preventDefault()

        if (!nameRegister || !telefoneRegister || !enderecoRegister) {
            return alert("Preencha nome, telefone e endereço!")
        }

        const cliente = {
            nome: nameRegister.trim(),
            cpf: cpfRegister.trim() || null,
            telefone: telefoneRegister.trim(),
            endereco: enderecoRegister.trim(),
        }

        try {
            const res = await fetch("http://localhost:3000/usuarios", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cliente),
            })

            const data = await res.json()

            if (!res.ok) {
                alert(data.error || "Erro ao cadastrar cliente")
                return
            }

            setNameRegister("")
            setCpfRegister("")
            setTelefoneRegister("")
            setEnderecoRegister("")

            buscarClientes()
        } catch (error) {
            console.error("Erro ao registrar cliente:", error)
            alert("Erro de conexão com o servidor")
        }
    }

    function filtrarClientes() {
        const termo = searchText.toLowerCase()
        return clientes.filter((cliente) =>
            cliente.nome.toLowerCase().includes(termo) ||
            cliente.cpf?.toLowerCase().includes(termo)
        )
    }

    return (
        <div id="container-dash">

            <button onClick={handleGoBack} id="goback-btn">
                <ArrowLeftIcon size={20} weight="bold" color="#e69216" />
            </button>

            <div id="search-area">
                <div>
                    <h1>Clientes</h1>

                    <input
                        placeholder="Pesquise aqui o cliente:"
                        type="search"
                        id="search-input"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>

                <div id="list-search">
                    {filtrarClientes().map((cliente) => (
                        <div
                            id="container-product"
                            key={cliente.id}
                            onClick={() => selecionarCliente(cliente)}
                        >
                            <div id="data-product">
                                <div className="information-text">
                                    <span>Nome: <span className="data">{cliente.nome}</span></span>
                                    <span>CPF: <span className="data">{cliente.cpf}</span></span>
                                </div>
                                <div className="information-text">
                                    <span>
                                        Dívida:{" "}
                                        <span
                                            className="data"
                                            style={{ color: Number(cliente.divida) > 0 ? "#c0392b" : "#27ae60" }}
                                        >
                                            R$ {Number(cliente.divida).toFixed(2)}
                                        </span>

                                        <span style={{ marginLeft: "10px" }}>
                                            Telefone:{" "}
                                            <span className="data">{cliente.telefone}</span>
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div id="register-area-cliente">

                <h1>Cadastrar:</h1>

                <div id="register-carts">

                    <div className="container-register-cliente">

                        <text>Cadastrar Cliente</text>
                        
                        <section>
                            <text>Nome:</text>
                            <input
                                value={nameRegister}
                                onChange={(e) => setNameRegister(e.target.value)}
                            />
                        </section>

                        <section>
                            <text>Telefone:</text>
                            <input
                                value={telefoneRegister}
                                onChange={(e) => setTelefoneRegister(e.target.value)}
                            />
                        </section>

                        <section>
                            <text>CPF (opcional):</text>
                            <input
                                value={cpfRegister}
                                onChange={(e) => setCpfRegister(e.target.value)}
                            />
                        </section>

                        <section>
                            <text>Endereço:</text>
                            <input
                                value={enderecoRegister}
                                onChange={(e) => setEnderecoRegister(e.target.value)}
                            />
                        </section>

                        <button onClick={registrarCliente}>Salvar</button>

                    </div>

                </div>

            </div>

        </div>
    )
}