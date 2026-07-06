import { useNavigate } from "react-router-dom"
import { ArrowLeftIcon } from "@phosphor-icons/react"
import React, { useState, useEffect } from "react"
import ProductList from "./ProductList"
import EditProduct from "./EditProduct"
import { type Produto, type Category } from "../../types"

import "./dash.css"

export default function Dashboard() {

    //Produto selecionado
    const [showEdit, setShowEdit] = useState(false)
    const [produtoSelecionado, setProdutoSelecionado] = useState<Produto>()

    //Listagem
    const [products, setProducts] = useState<Produto[]>([])
    const [category, setCategory] = useState<Category[]>([])
    const navigate = useNavigate()

    //Cadastro produto
    const [nameRegister, setNameRegister] = useState("")
    const [quantityRegister, setQuantityRegister] = useState("")
    const [priceRegister, setPriceRegister] = useState<Number>()
    const [codeRegister, setCodeRegister] = useState("")
    const [categoryRegister, setCategoryRegister] = useState("")
    const [descontoRegister, setDescontoRegister] = useState("")

    //Cadastro categoria
    const [categoryNameRegister, setCategoryNameRegister] = useState("")

    //Procura por filtro
    const [searchText, setSearchText] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState("")

    //Backup
    const [file, setFile] = useState<File | null>();


    console.log(produtoSelecionado?.id)

    useEffect(() => {
        carregarDados()
    }, [])

    function handleGoBack() {
        navigate("/")
    }

    const baixarBackup = async () => {
        const res = await fetch("http://localhost:3000/backup");
        const blob = await res.blob();

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "backup.db";
        a.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.currentTarget.files?.[0];

        if (!selectedFile) return;

        if (!selectedFile.name.endsWith(".db")) {
            alert("Selecione um arquivo .db");
            return;
        }

        setFile(selectedFile);
    };

    const handleRestore = async () => {
        if (!file) {
            alert("Selecione um arquivo primeiro");
            return;
        }

        if (!confirm("Isso vai sobrescrever o banco de dados atual. Deseja continuar?")) return;

        const formData = new FormData();
        formData.append("backup", file);

        try {
            const res = await fetch("http://localhost:3000/restore", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            alert(data.message || data.error);
        } catch (err) {
            console.error(err);
            alert("Erro ao conectar com o servidor");
        }
    };

    function selecionarProduto(produto: Produto) {
        setProdutoSelecionado(produto)
        setShowEdit(true)
        console.log(produto.id + "aa")
    }

    async function registrarProduto(e: React.MouseEvent) {
        e.preventDefault()

        if (!nameRegister || !priceRegister || !quantityRegister || !codeRegister || !categoryRegister) {
            return alert("Preencha todos os campos!");
        }

        const textoDesconto = descontoRegister.trim()

        if (textoDesconto !== "") {
            const semSinal = textoDesconto.replace("%", "").replace(",", ".")
            const valorNumerico = Number(semSinal)

            if (isNaN(valorNumerico) || valorNumerico <= 0) {
                return alert("Desconto inválido. Use um número (ex: 10) ou uma porcentagem (ex: 10%).")
            }

            if (textoDesconto.endsWith("%") && valorNumerico > 100) {
                return alert("Desconto percentual não pode passar de 100%.")
            }
        }

        const produto = {
            nome: nameRegister.trim(),
            code: codeRegister.trim(),
            preco: Number(priceRegister),
            estoque: Number(quantityRegister),
            categoriaId: Number(categoryRegister),
            desconto: textoDesconto
        }

        if (isNaN(produto.preco) || produto.preco <= 0) {
            return alert("Preço inválido");
        }

        if (isNaN(produto.estoque) || produto.estoque < 0) {
            return alert("Estoque inválido");
        }

        try {
            const res = await fetch("http://localhost:3000/produtos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(produto)
            })

            const data = await res.json()
            setNameRegister("")
            setPriceRegister(0)
            setQuantityRegister("")
            setCodeRegister("")
            setCategoryRegister("")
            setDescontoRegister("")
            if (!res.ok) {
                alert(data.error || "Erro ao cadastrar produto");
                return;
            }



            carregarDados()

        } catch (error) {
            console.error("Erro ao registrar produto:", error)
            alert("Erro de conexão com o servidor")
        }
    }

    async function buscarProdutos() {
        const response = await fetch("http://localhost:3000/produtos")
        const data = await response.json()
        setProducts(data)
    }

    async function buscarCategorias() {
        const response = await fetch("http://localhost:3000/categorias")
        const data = await response.json()
        setCategory(data)
    }

    async function carregarDados() {
        await buscarProdutos()
        await buscarCategorias()
    }

    async function registrarCategoria() {
        try {
            const response = await fetch("http://localhost:3000/categorias", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nome: categoryNameRegister
                })
            })

            await response.json()

            setCategoryNameRegister("")
            carregarDados()

        } catch (error) {
            console.error("Erro ao criar categoria:", error)
        }
    }

    async function deletarCategoria() {
        try {
            const categoryDel = category.find((p: Category) => p.nome === categoryNameRegister);
            const catId = categoryDel?.id;

            const response = await fetch(
                `http://localhost:3000/categorias/${catId}`, {
                method: "DELETE",
            }
            )

            setCategoryNameRegister("")
            carregarDados()
            console.log(response)

        } catch (error) {
            console.error("Erro ao deletar categoria:", error)
        }
    }

    function filtrarProdutos() {

        const termo = searchText.toLowerCase()

        return products.filter((produto) => {

            const nomeMatch =
                produto.nome.toLowerCase().includes(termo)

            const codigoMatch =
                produto.code?.toLowerCase().includes(termo)

            const categoriaMatch =
                categoryFilter === "" ||
                produto.categoriaId === Number(categoryFilter)

            let statusMatch = true

            if (statusFilter === "in") {
                statusMatch = Number(produto.estoque) > 0
            }

            if (statusFilter === "out") {
                statusMatch = Number(produto.estoque) === 0
            }

            return (nomeMatch || codigoMatch) && categoriaMatch && statusMatch
        })
    }

    return (
        <div id="container-dash">


            {showEdit && produtoSelecionado && (
                <EditProduct
                    id={produtoSelecionado.id}
                    nome={produtoSelecionado.nome}
                    code={produtoSelecionado.code}
                    preco={produtoSelecionado.preco}
                    desconto={produtoSelecionado.desconto}
                    tipoDesconto={produtoSelecionado.tipoDesconto}
                    estoque={produtoSelecionado.estoque}
                    categoriaId={produtoSelecionado.categoriaId}
                    onClose={() => setShowEdit(false)}
                    onUpdate={buscarProdutos}
                />
            )}

            <button onClick={handleGoBack} id="goback-btn">
                <ArrowLeftIcon size={20} weight="bold" color="#e69216" />
            </button>

            <div id="search-area">
                <div>
                    <h1>Estoque</h1>

                    <input
                        placeholder="Pesquise aqui o produto:"
                        type="search"
                        id="search-input"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />

                    <div id="selects">

                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="">Categorias</option>
                            {category.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.nome}
                                </option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">Status</option>
                            <option value="in">Em estoque</option>
                            <option value="out">Sem estoque</option>
                        </select>

                    </div>
                </div>

                <div id="list-search">
                    {filtrarProdutos().map((produto: Produto) => (
                        <ProductList
                            id={produto.id}
                            nome={produto.nome}
                            code={produto.code}
                            preco={Number(produto.preco).toFixed(2)}
                            desconto={produto.desconto}
                            precoComDesconto={produto.precoComDesconto}
                            estoque={produto.estoque}
                            onClick={() => selecionarProduto(produto)}
                        />
                    ))}
                </div>

            </div>

            <div id="register-area">

                <h1>Cadastrar:</h1>

                <div id="register-carts">

                    <div className="container-register">

                        <text>Cadastrar Produto</text>

                        <section>
                            <text>Nome do produto:</text>
                            <input
                                value={nameRegister}
                                onChange={(e) => setNameRegister(e.target.value)}
                            />
                        </section>

                        <section>
                            <text>Código do produto:</text>
                            <input
                                value={codeRegister}
                                onChange={(e) => setCodeRegister(e.target.value)}
                            />
                        </section>

                        <section>
                            <text>Quantidade do produto:</text>
                            <input
                                type="number"
                                min="0"
                                value={quantityRegister}
                                onChange={(e) => setQuantityRegister(e.target.value)}
                            />
                        </section>

                        <section>
                            <text>Valor do produto:</text>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={priceRegister as any}
                                onChange={(e) => setPriceRegister(e.target.value)}
                            />
                        </section>

                        <section>
                            <text>Desconto — opcional (ex: 10 ou 10%):</text>
                            <input
                                type="text"
                                placeholder="Sem desconto"
                                value={descontoRegister}
                                onChange={(e) => setDescontoRegister(e.target.value)}
                            />
                        </section>

                        <section>
                            <text>Categoria do produto:</text>
                            <select
                                value={categoryRegister}
                                onChange={(e) => setCategoryRegister(e.target.value)}
                            >
                                <option value="">Categorias</option>

                                {category.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.nome}
                                    </option>
                                ))}

                            </select>
                        </section>

                        <button onClick={registrarProduto}>Salvar</button>

                    </div>

                    <div className="container-register">

                        <text>Cadastrar Categoria</text>

                        <section>
                            <text>Nome da categoria:</text>
                            <input
                                value={categoryNameRegister}
                                onChange={(e) => setCategoryNameRegister(e.target.value)}
                            />
                        </section>

                        <button onClick={registrarCategoria}>Salvar</button>
                        <button onClick={deletarCategoria}>Deletar</button>

                    </div>

                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                    <a style={{ color: "black", textDecorationLine: "underline", fontSize: "12px", cursor: "pointer" }} onClick={baixarBackup}>Fazer backup</a>
                    <label
                        style={{
                            color: "black",
                            textDecorationLine: "underline",
                            fontSize: "12px",
                            cursor: "pointer",
                        }}
                    >
                        Selecionar Arquivo
                        <input style={{ display: "none" }} type="file" onChange={handleFileChange}></input>
                    </label>

                    <a style={{ color: "black", textDecorationLine: "underline", fontSize: "12px", cursor: "pointer" }} onClick={handleRestore}>Restaurar</a>
                </div>

            </div>

        </div>
    )
}