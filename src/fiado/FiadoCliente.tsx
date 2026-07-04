import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ArrowLeftIcon } from "@phosphor-icons/react"
import { type User, type Produto } from "../types"
import "./fiadocliente.css"

type Pagamento = {
    id: string
    valor: number
    data: string
    usuarioId: number
}

type Venda = {
    id: number
    data: string
    total: number
    metodo: string
    itens: {
        id: number
        quantidade: number
        preco: number
        produto: Produto
    }[]
}

export default function FiadoCliente() {

    const navigate = useNavigate()
    const location = useLocation()
    const clienteRecebido = (location.state as { cliente?: User } | null)?.cliente

    function handleGoBack() {
        navigate("/Clientes")
    }

    //Cliente
    const [cliente, setCliente] = useState<User | undefined>(clienteRecebido)
    const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
    const [vendas, setVendas] = useState<Venda[]>([])

    //Edição cliente
    const [showEdit, setShowEdit] = useState(false)
    const [nameEdit, setNameEdit] = useState("")
    const [cpfEdit, setCpfEdit] = useState("")
    const [enderecoEdit, setEnderecoEdit] = useState("")

    //Registrar pagamento
    const [valorPagamento, setValorPagamento] = useState("")

    useEffect(() => {
        // Se a página foi recarregada (F5), o state do React Router se perde.
        // Sem id na URL, não há como buscar o cliente de novo — volta pra lista.
        if (!clienteRecebido) {
            navigate("/Clientes")
            return
        }

        buscarPagamentos(clienteRecebido.id)
        buscarVendas(clienteRecebido.id)
    }, [])

    async function buscarPagamentos(usuarioId: number) {
        const response = await fetch(`http://localhost:3000/usuarios/${usuarioId}/pagamentos`)
        const data = await response.json()
        setPagamentos(data)
    }

    async function buscarVendas(usuarioId: number) {
        const response = await fetch(`http://localhost:3000/usuarios/${usuarioId}/vendas`)
        const data = await response.json()
        setVendas(data)
    }

    async function atualizarCliente(usuarioId: number) {
        const response = await fetch("http://localhost:3000/usuarios")
        const data: User[] = await response.json()
        const atualizado = data.find((u) => u.id === usuarioId)
        if (atualizado) setCliente(atualizado)
    }

    function abrirEdicao() {
        if (!cliente) return
        setNameEdit(cliente.nome)
        setCpfEdit(cliente.cpf)
        setEnderecoEdit(cliente.endereco)
        setShowEdit(true)
    }

    async function salvarEdicaoCliente() {
        if (!cliente) return

        if (!nameEdit || !cpfEdit || !enderecoEdit) {
            return alert("Preencha todos os campos!")
        }

        try {
            const res = await fetch(`http://localhost:3000/usuarios/${cliente.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: nameEdit.trim(),
                    cpf: cpfEdit.trim(),
                    endereco: enderecoEdit.trim(),
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                alert(data.error || "Erro ao atualizar cliente")
                return
            }

            setShowEdit(false)
            await atualizarCliente(cliente.id)
        } catch (error) {
            console.error("Erro ao atualizar cliente:", error)
            alert("Erro de conexão com o servidor")
        }
    }

    async function deletarCliente() {
        if (!cliente) return

        if (Number(cliente.divida) > 0) {
            if (!confirm("Este cliente possui dívida em aberto. Deseja deletar mesmo assim?")) return
        } else {
            if (!confirm("Tem certeza que deseja deletar este cliente?")) return
        }

        try {
            await fetch(`http://localhost:3000/usuarios/${cliente.id}`, {
                method: "DELETE",
            })

            navigate("/Clientes")
        } catch (error) {
            console.error("Erro ao deletar cliente:", error)
            alert("Erro de conexão com o servidor")
        }
    }

    // Formata enquanto digita, no padrão "120,00" — considera os dígitos
    // digitados como centavos, igual máscara de valor monetário de app bancário.
    function formatarValorDigitado(input: string) {
        const apenasDigitos = input.replace(/\D/g, "")

        if (!apenasDigitos) return ""

        const numero = Number(apenasDigitos) / 100

        return numero.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    }

    function handleValorPagamentoChange(e: React.ChangeEvent<HTMLInputElement>) {
        setValorPagamento(formatarValorDigitado(e.target.value))
    }

    // Converte "1.234,56" de volta para número (1234.56) antes de enviar ao backend
    function valorPagamentoNumerico() {
        const limpo = valorPagamento.replace(/\./g, "").replace(",", ".")
        return Number(limpo)
    }

    async function registrarPagamento() {
        if (!cliente) return

        const valor = valorPagamentoNumerico()

        if (isNaN(valor) || valor <= 0) {
            return alert("Insira um valor de pagamento válido")
        }

        if (valor > Number(cliente.divida)) {
            if (!confirm("O valor é maior que a dívida atual. Deseja continuar?")) return
        }

        try {
            await fetch(`http://localhost:3000/usuarios/${cliente.id}/pagamentos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ valor }),
            })

            setValorPagamento("")
            await buscarPagamentos(cliente.id)
            await atualizarCliente(cliente.id)

            alert("Pagamento registrado com sucesso!")
        } catch (error) {
            console.error("Erro ao registrar pagamento:", error)
            alert("Erro ao registrar pagamento")
        }
    }

    if (!cliente) return null

    return (
        <div id="container-fiado-cliente">

            {showEdit && (
                <div id="bg-edit" onClick={() => setShowEdit(false)}>
                    <div id="container-edit" onClick={(e) => e.stopPropagation()}>

                        <button id="close-btn-edit" onClick={() => setShowEdit(false)}>
                            ✕
                        </button>

                        <h1>Editar Cliente</h1>

                        <section>
                            <label>Nome:</label>
                            <input
                                value={nameEdit}
                                onChange={(e) => setNameEdit(e.target.value)}
                            />
                        </section>

                        <section>
                            <label>CPF:</label>
                            <input
                                value={cpfEdit}
                                onChange={(e) => setCpfEdit(e.target.value)}
                            />
                        </section>

                        <section>
                            <label>Endereço:</label>
                            <input
                                value={enderecoEdit}
                                onChange={(e) => setEnderecoEdit(e.target.value)}
                            />
                        </section>

                        <section style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
                            <button onClick={salvarEdicaoCliente}>Salvar</button>
                            <button onClick={deletarCliente}>Deletar</button>
                        </section>

                    </div>
                </div>
            )}

            <button onClick={handleGoBack} id="goback-btn">
                <ArrowLeftIcon size={20} weight="bold" color="#e69216" />
            </button>

            <div id="conteudo-fiado-cliente">

                <div id="coluna-info">
                    <section id="header-cliente">
                        <div>
                            <h1 style={{ margin: "0 0 4px 0" }}>{cliente.nome}</h1>
                            <p className="info-secundaria">CPF: {cliente.cpf}</p>
                            <p className="info-secundaria">Endereço: {cliente.endereco}</p>
                        </div>
                        <div id="divida-area">
                            <span>Dívida atual</span>
                            <strong style={{ color: Number(cliente.divida) > 0 ? "#c0392b" : "#27ae60" }}>
                                R$ {Number(cliente.divida).toFixed(2)}
                            </strong>
                            <button onClick={abrirEdicao}>Gerenciar cliente</button>
                        </div>
                    </section>

                    <section id="registrar-pagamento">
                        <span>Registrar pagamento:</span>
                        <div id="input-pagamento-wrapper">
                            <span className="prefixo-moeda">R$</span>
                            <input
                                placeholder="0,00"
                                inputMode="numeric"
                                value={valorPagamento}
                                onChange={handleValorPagamentoChange}
                                onKeyDown={(e) => { if (e.key === "Enter") registrarPagamento() }}
                            />
                        </div>
                        <button onClick={registrarPagamento}>Pagar</button>
                    </section>
                </div>

                <section id="historico-area">
                    <div className="historico-bloco">
                        <h3>Pagamentos</h3>
                        {pagamentos.length === 0 ? (
                            <p className="vazio">Nenhum pagamento registrado</p>
                        ) : (
                            pagamentos.map((pagamento) => (
                                <div key={pagamento.id} className="linha-pagamento">
                                    <span>{new Date(pagamento.data).toLocaleDateString("pt-BR")}</span>
                                    <span className="valor-pago">R$ {Number(pagamento.valor).toFixed(2)}</span>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="historico-bloco">
                        <h3>Compras a fiado</h3>
                        {vendas.length === 0 ? (
                            <p className="vazio">Nenhuma compra registrada</p>
                        ) : (
                            vendas.map((venda) => (
                                <div key={venda.id} className="card-venda">
                                    <div className="header-venda">
                                        <span>Venda #{venda.id}</span>
                                        <span>{new Date(venda.data).toLocaleDateString("pt-BR")}</span>
                                    </div>
                                    {venda.itens.map((item) => (
                                        <div key={item.id} className="item-venda">
                                            <span>{item.quantidade}x {item.produto.nome}</span>
                                            <span>R$ {item.preco.toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className="total-venda">
                                        Total: R$ {Number(venda.total).toFixed(2)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

            </div>

        </div>
    )
}