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
    const [telefoneEdit, setTelefoneEdit] = useState("")
    const [enderecoEdit, setEnderecoEdit] = useState("")
    const [dividaEdit, setDividaEdit] = useState("")
    const [observacaoEdit, setObservacaoEdit] = useState("")

    //Registrar pagamento
    const [valorPagamento, setValorPagamento] = useState("")

    //Edição de venda (data, produtos, exclusão)
    const [editingVenda, setEditingVenda] = useState<Venda | null>(null)
    const [dataEdit, setDataEdit] = useState("")
    const [itensEdit, setItensEdit] = useState<{ id: number; produtoId: number; nome: string; quantidade: number; preco: number }[]
    >([])

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
        setCpfEdit(cliente.cpf || "")
        setTelefoneEdit(cliente.telefone)
        setEnderecoEdit(cliente.endereco)
        setDividaEdit(Number(cliente.divida).toFixed(2).replace(".", ","))
        setObservacaoEdit(cliente.observacao || "")
        setShowEdit(true)
    }

    // Mesma máscara usada no campo de pagamento: digita e formata como "120,00"
    function formatarValorDigitado(input: string) {
        const apenasDigitos = input.replace(/\D/g, "")

        if (!apenasDigitos) return ""

        const numero = Number(apenasDigitos) / 100

        return numero.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    }

    function handleDividaEditChange(e: React.ChangeEvent<HTMLInputElement>) {
        setDividaEdit(formatarValorDigitado(e.target.value))
    }

    // Converte "1.234,56" de volta para número (1234.56)
    function paraNumero(valorFormatado: string) {
        const limpo = valorFormatado.replace(/\./g, "").replace(",", ".")
        return Number(limpo)
    }

    async function salvarEdicaoCliente() {
        if (!cliente) return

        if (!nameEdit || !telefoneEdit || !enderecoEdit) {
            return alert("Preencha nome, telefone e endereço!")
        }

        const dividaNumerica = paraNumero(dividaEdit)

        if (isNaN(dividaNumerica) || dividaNumerica < 0) {
            return alert("Insira um valor de dívida válido")
        }

        try {
            const res = await fetch(`http://localhost:3000/usuarios/${cliente.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: nameEdit.trim(),
                    cpf: cpfEdit.trim() || null,
                    telefone: telefoneEdit.trim(),
                    endereco: enderecoEdit.trim(),
                    divida: dividaNumerica,
                    observacao: observacaoEdit.trim() || null,
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
    function handleValorPagamentoChange(e: React.ChangeEvent<HTMLInputElement>) {
        setValorPagamento(formatarValorDigitado(e.target.value))
    }

    function valorPagamentoNumerico() {
        return paraNumero(valorPagamento)
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

    // ---------------- Edição / exclusão de venda ----------------

    // Converte uma data ISO (vinda do backend) para "dd/mm/aaaa" usando o
    // horário local, evitando o bug de fuso do toISOString()
    function paraDataBR(dataISO: string) {
        const d = new Date(dataISO)
        const dia = String(d.getUTCDate()).padStart(2, "0")
        const mes = String(d.getUTCMonth() + 1).padStart(2, "0")
        const ano = d.getUTCFullYear()
        return `${dia}/${mes}/${ano}`
    }

    // Máscara: digita e formata como "31/07/2026", igual ao mask de valor
    function formatarDataDigitada(input: string) {
        const digitos = input.replace(/\D/g, "").slice(0, 8)

        if (!digitos) return ""

        const dia = digitos.slice(0, 2)
        const mes = digitos.slice(2, 4)
        const ano = digitos.slice(4, 8)

        let resultado = dia
        if (digitos.length > 2) resultado += "/" + mes
        if (digitos.length > 4) resultado += "/" + ano

        return resultado
    }

    function handleDataEditChange(e: React.ChangeEvent<HTMLInputElement>) {
        setDataEdit(formatarDataDigitada(e.target.value))
    }

    // Converte "31/07/2026" de volta para "2026-07-31" (formato que o backend espera)
    function dataBRParaISO(dataBR: string) {
        const [dia, mes, ano] = dataBR.split("/")
        if (!dia || !mes || !ano || ano.length < 4) return null
        return `${ano}-${mes}-${dia}`
    }

    function abrirEdicaoVenda(venda: Venda) {
        setEditingVenda(venda)
        setDataEdit(paraDataBR(venda.data))
        setItensEdit(venda.itens.map((item) => ({
            id: item.id,
            produtoId: item.produto.id,
            nome: item.produto.nome,
            quantidade: item.quantidade,
            preco: item.preco,
        })))
    }

    function alterarQuantidadeItem(id: number, quantidade: number) {
        setItensEdit((prev) => prev.map((item) => (item.id === id ? { ...item, quantidade } : item)))
    }

    function alterarPrecoItem(id: number, preco: number) {
        setItensEdit((prev) => prev.map((item) => (item.id === id ? { ...item, preco } : item)))
    }

    function removerItem(id: number) {
        setItensEdit((prev) => prev.filter((item) => item.id !== id))
    }

    const totalEdit = itensEdit.reduce((soma, item) => soma + item.quantidade * item.preco, 0)

    async function salvarEdicaoVenda() {
        if (!editingVenda || !cliente) return

        if (itensEdit.length === 0) {
            return alert("A venda precisa ter ao menos um produto")
        }

        const dataISO = dataBRParaISO(dataEdit)

        if (!dataISO) {
            return alert("Insira uma data válida (dd/mm/aaaa)")
        }

        try {
            const res = await fetch(`http://localhost:3000/vendas/${editingVenda.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    data: dataISO,
                    itens: itensEdit.map((item) => ({
                        produtoId: item.produtoId,
                        quantidade: item.quantidade,
                        preco: item.preco,
                    })),
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                alert(data.error || "Erro ao editar venda")
                return
            }

            setEditingVenda(null)
            await buscarVendas(cliente.id)
            await atualizarCliente(cliente.id)
        } catch (error) {
            console.error("Erro ao editar venda:", error)
            alert("Erro de conexão com o servidor")
        }
    }

    async function excluirVenda() {
        if (!editingVenda || !cliente) return

        if (!confirm("Tem certeza que deseja excluir esta compra? O estoque e a dívida serão ajustados.")) return

        try {
            const res = await fetch(`http://localhost:3000/vendas/${editingVenda.id}`, {
                method: "DELETE",
            })

            if (!res.ok) {
                const data = await res.json()
                alert(data.error || "Erro ao excluir venda")
                return
            }

            setEditingVenda(null)
            await buscarVendas(cliente.id)
            await atualizarCliente(cliente.id)
        } catch (error) {
            console.error("Erro ao excluir venda:", error)
            alert("Erro de conexão com o servidor")
        }
    }

    if (!cliente) return null

    return (
        <div id="container-fiado-cliente">

            {showEdit && (
                <div id="bg-edit-cliente" onClick={() => setShowEdit(false)}>
                    <div id="container-edit-cliente" onClick={(e) => e.stopPropagation()}>

                        <div id="header-modal-edit">
                            <h1>Editar Cliente</h1>
                            <button id="close-btn-edit-cliente" onClick={() => setShowEdit(false)}>
                                ✕
                            </button>
                        </div>

                        <section>
                            <label>Nome:</label>
                            <input
                                value={nameEdit}
                                onChange={(e) => setNameEdit(e.target.value)}
                            />
                        </section>

                        <section>
                            <label>Telefone:</label>
                            <input
                                value={telefoneEdit}
                                onChange={(e) => setTelefoneEdit(e.target.value)}
                            />
                        </section>

                        <section>
                            <label>CPF (opcional):</label>
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

                        <section>
                            <label>Dívida (R$):</label>
                            <input
                                inputMode="numeric"
                                placeholder="0,00"
                                value={dividaEdit}
                                onChange={handleDividaEditChange}
                            />
                        </section>

                        <section>
                            <label>Observações:</label>
                            <textarea
                                placeholder="Anote aqui informações sobre o cliente"
                                rows={4}
                                value={observacaoEdit}
                                onChange={(e) => setObservacaoEdit(e.target.value)}
                            />
                        </section>

                        <section style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
                            <button onClick={salvarEdicaoCliente}>Salvar</button>
                            <button onClick={deletarCliente}>Deletar</button>
                        </section>

                    </div>
                </div>
            )}

            {editingVenda && (
                <div id="bg-edit-cliente" onClick={() => setEditingVenda(null)}>
                    <div id="container-edit-cliente" onClick={(e) => e.stopPropagation()}>

                        <div id="header-modal-edit">
                            <h1>Editar compra #{editingVenda.id}</h1>
                            <button id="close-btn-edit-cliente" onClick={() => setEditingVenda(null)}>
                                ✕
                            </button>
                        </div>

                        <section>
                            <label>Data da compra:</label>
                            <input
                                placeholder="dd/mm/aaaa"
                                inputMode="numeric"
                                value={dataEdit}
                                onChange={handleDataEditChange}
                            />
                        </section>

                        <section>
                            <label>Produtos:</label>
                            {itensEdit.map((item) => (
                                <div
                                    key={item.id}
                                    style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}
                                >
                                    <span style={{ flex: 1 }}>{item.nome}</span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={item.quantidade}
                                        onChange={(e) => alterarQuantidadeItem(item.id, Number(e.target.value))}
                                        style={{ width: "60px" }}
                                    />
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={item.preco}
                                        onChange={(e) => alterarPrecoItem(item.id, Number(e.target.value))}
                                        style={{ width: "80px" }}
                                    />
                                    <button type="button" onClick={() => removerItem(item.id)}>✕</button>
                                </div>
                            ))}
                        </section>

                        <p>
                            <strong>Novo total:</strong> R${" "}
                            {totalEdit.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>

                        <section style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
                            <button onClick={salvarEdicaoVenda}>Salvar</button>
                            <button onClick={excluirVenda}>Excluir compra</button>
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
                            <p className="info-secundaria">Telefone: {cliente.telefone}</p>
                            {cliente.observacao && (
                                <p className="info-secundaria observacao-texto">Observação: {cliente.observacao}</p>
                            )}
                        </div>
                        <div id="divida-area">
                            <span>Dívida atual</span>
                            <strong style={{ color: Number(cliente.divida) > 0 ? "#c0392b" : "#27ae60" }}>
                                R$ {Number(cliente.divida).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                    <span className="valor-pago">R$ {Number(pagamento.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                                        <span>{paraDataBR(venda.data)}</span>
                                        <button onClick={() => abrirEdicaoVenda(venda)}>Editar</button>
                                    </div>
                                    {venda.itens.map((item) => (
                                        <div key={item.id} className="item-venda">
                                            <span>{item.quantidade}x {item.produto.nome}</span>
                                            <span>R$ {item.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    ))}
                                    <div className="total-venda">
                                        Total: R$ {Number(venda.total).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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