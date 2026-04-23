import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import ProductList from "./ProductListSales"
import NotaFiscal from "./NotaFiscal"
import { TrashIcon, ArrowLeftIcon } from "@phosphor-icons/react"
import "./sales.css"
import { type Produto, type User, type CartItem, type Category } from "../../types"

export default function Sales() {

    useEffect(() => {
        carregarDados()
    }, [])

    const navigate = useNavigate()

    //Booleans
    const [showNote, setShowNote] = useState<Boolean>(false)

    //Dados para nota fiscal
    const [cliente, setCliente] = useState<User>()
    const [itens, setItens] = useState<CartItem[]>()
    const [totalItens, setTotalItens] = useState<number>()
    const [totalFinal, setTotalFinal] = useState<number>()
    const [descontoNota, setDescontoNota] = useState<number>()
    const [data, setData] = useState<string>()


    //Valores
    const [usuarioSelecionado, setUsuarioSelecionado] = useState<User>()
    const [descontoInput, setDescontoInput] = useState(""); // controla o valor digitado
    const [desconto, setDesconto] = useState<{ tipo: "valor" | "percentual"; valor: number }>({
        tipo: "valor",
        valor: 0,
    });

    console.log(usuarioSelecionado + "taassa")

    //Produto selecionados
    const [productSelected, SetProductSelected] = useState<Produto>()
    const [cart, setCart] = useState<CartItem[]>([])
    const [metodoPagamento, setMetodoPagamento] = useState("")

    console.log(cart)

    //Listagem
    const [users, SetUsers] = useState<User[]>([])
    const [products, setProducts] = useState<Produto[]>([])
    const [category, setCategory] = useState<Category[]>([])

    //Procura por filtro
    const [searchText, setSearchText] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState("")

    const metodoPag = ["DINHEIRO", "PIX", "CARTAO_DEBITO", "CARTAO_CREDITO"]

    function handleGoBack() {
        navigate("/")
    }

    function handleGoFinalizar(){
        navigate("/Finalizar")
    }

    const finalizarVenda = async (usarUsuario = false) => {
        try {
            if (cart.length === 0) return alert("Carrinho vazio!");

            const subtotalCarrinho = cart.reduce(
                (acc, item) => acc + item.preco * item.quantidade,
                0
            );

            const itensComDesconto = cart.map((item) => {
                let precoFinal = Number(item.preco);

                if (desconto.tipo === "valor" && desconto.valor > 0) {
                    const subtotalItem = precoFinal * item.quantidade;
                    const descontoProporcional = (subtotalItem / subtotalCarrinho) * desconto.valor;
                    precoFinal = precoFinal - descontoProporcional / item.estoque;
                } else if (desconto.tipo === "percentual" && desconto.valor > 0) {
                    precoFinal = precoFinal * (1 - desconto.valor / 100);
                }

                return {
                    id: item.id,
                    quantidade: item.quantidade,
                    preco: Number(precoFinal.toFixed(2)),
                };
            });


            const body = {
                itens: itensComDesconto,
                usuarioId: usarUsuario ? usuarioSelecionado?.id : null,
                metodoPag: metodoPagamento,
            };



            const response = await fetch("http://localhost:3000/vendas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text);
            }

            await response.json();


            const dataAtual = new Date().toLocaleDateString('pt-BR');
            const totalComDesconto = calculaTotal()

            setCliente(usuarioSelecionado);
            setItens(cart);
            setTotalItens(cart.length)
            setTotalFinal(totalComDesconto);
            setDescontoNota(desconto.valor);
            setData(String(dataAtual));
            setShowNote(true);

            setCart([]);
            setDesconto({ tipo: "valor", valor: 0 });
            setDescontoInput("");
            buscarProdutos();
            setMetodoPagamento("")


            alert("Venda finalizada com sucesso!");
        } catch (err) {
            const error = err as Error;
            console.error("Erro ao finalizar venda:", error.message);
            alert(error.message);
        }
    };

    async function buscarClientes() {
        const response = await fetch("http://localhost:3000/usuarios")
        const data = await response.json()
        SetUsers(data)
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
        await buscarClientes()
        await buscarProdutos()
        await buscarCategorias()
    }


    function filtrarProdutos() {

        const termo = searchText.toLowerCase()

        return products.filter((produto: Produto) => {

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

    const addProduct = (produto: Produto) => {

        const produtoAtual = products.find((p: Produto) => p.id === produto.id);

        if (!produtoAtual) return;

        if (produtoAtual.estoque <= 0) {
            return alert("Produto sem estoque!");
        }

        setCart((prev: CartItem[]) => {
            const existente = prev.find((p) => p.id === produto.id);

            if (existente) {

                if (existente.quantidade >= produtoAtual.estoque) {
                    alert("Limite de estoque atingido!");
                    return prev;
                }

                return prev.map((p) =>
                    p.id === produto.id
                        ? { ...p, quantidade: p.quantidade + 1 }
                        : p
                );
            }

            const novoItem: CartItem = {
                id: produto.id,
                nome: produto.nome,
                preco: produto.preco,
                quantidade: 1,
                estoque: produtoAtual.estoque,
                code: produto.code,
            };

            return [...prev, novoItem];
        });
    };

    function addUser(id: Number) {
        const userId = id;

        const user = users.find(u => u.id === userId) || null;


        if (user != null) {
            setUsuarioSelecionado(user);
        }
    }


    function increaseQuantity(id: number) {
        const produtoAtual = products.find(p => p.id === id);
        if (!produtoAtual || produtoAtual.estoque <= 0) return;

        setCart(prev =>
            prev.map(item =>
                item.id === id
                    ? { ...item, quantidade: Math.min(item.quantidade + 1, produtoAtual.estoque) }
                    : item
            )
        );
    }

    function decreaseQuantity(id: number) {
        setCart(prev =>
            prev
                .map(item =>
                    item.id === id
                        ? { ...item, quantidade: item.quantidade - 1 }
                        : item
                )
                .filter(item => item.quantidade > 0)
        );
    }

    function removeProduct(id: number) {
        setCart(prev =>
            prev.filter(item => item.id !== id)
        );
    }

    const aplicarDesconto = (input: string) => {
        if (!input) return alert("Insira um valor de desconto");

        let tipo: "valor" | "percentual" = "valor";
        let valor = input.trim();

        if (valor.endsWith("%")) {
            tipo = "percentual";
            valor = valor.replace("%", "");
        }

        let numero = Number(valor.replace(",", "."));
        if (isNaN(numero) || numero <= 0) {
            return alert("Insira um valor válido para desconto");
        }

        if (tipo === "percentual" && numero > 100) {
            numero = 100;
        }

        setDesconto({ tipo, valor: numero });
        setDescontoInput("");
    };

    const subtotal = cart.reduce((acc, item) => {
        return acc + (Number(item.preco) * Number(item.quantidade))
    }, 0)

    const calculaTotal = () => {
        let total = subtotal;

        if (desconto.tipo === "valor") {
            total -= desconto.valor;
        } else if (desconto.tipo === "percentual") {
            total -= (subtotal * desconto.valor) / 100;
        }

        return Math.max(0, total); 
    };

    return (
        <div id="container-sales">
            {
                showNote ? <NotaFiscal
                    cliente={cliente}
                    itens={itens}
                    totalItens={totalItens}
                    totalFinal={totalFinal}
                    desconto={descontoNota}
                    data={data}
                    onClose={()=> setShowNote(false)}
                />
                    :
                    <></>
            }

            <div id="search-area">
                <button onClick={handleGoBack} id="goback-btn">
                    <ArrowLeftIcon size={20} weight="bold" color="#e69216" />
                </button>
                <div>
                    <h1>Pesquisar</h1>

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
                            preco={produto.preco}
                            estoque={produto.estoque}
                            selected={productSelected?.id === produto.id}
                            onClick={() => SetProductSelected(produto)}
                        />
                    ))}
                </div>

                <button id="add-btn" disabled={!productSelected} onClick={() => addProduct(productSelected!)}>Adicionar</button>
            </div>

            <div id="container-cart">

                <h1>Carrinho</h1>
                <section id="cart">
                    <section id="header">
                        <span>Nome</span>
                        <span>Código</span>
                        <span>Quantidade</span>
                        <span>Valor</span>
                    </section>

                    <section id="products-cart">
                        {cart.map((produto) => (
                            <div id="container-products-cart">
                                <span>{produto.nome}</span>
                                <span>{produto.code}</span>
                                <section id="quantity-product-cart">
                                    <button id="minus-cart" onClick={() => decreaseQuantity(produto.id)}>-</button>
                                    <span>{produto.quantidade}</span>
                                    <button id="plus-cart" onClick={() => increaseQuantity(produto.id)}>+</button>
                                </section>

                                <span>R${produto.preco.toFixed(2)}</span>
                                <span>
                                    <TrashIcon
                                        onClick={() => removeProduct(produto.id)}
                                        color="red"
                                        weight="bold"
                                        cursor="pointer" />
                                </span>
                            </div>
                        ))}
                    </section>

                    <section id="footer">
                        <span className="subtotal">Subtotal: {subtotal.toFixed(2)}R$</span>
                        <span className="subtotal">Desconto: {desconto.valor.toFixed(2)}</span>
                        <span id="total">Total: {calculaTotal().toFixed(2)}</span>
                    </section>
                </section>

                <section id="data-sale">

                    <section id="clientes-select">
                        <span>Cliente:</span>
                        <select
                            value={usuarioSelecionado?.nome}
                            onChange={(e) => addUser(Number(e.target.value))}
                        >
                            <option value="">Clientes</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.nome}
                                </option>
                            ))}
                        </select>
                    </section>

                    <section id="clientes-select">
                        <span>Metodo:</span>
                        <select
                            value={metodoPagamento}
                            onChange={(e) => setMetodoPagamento(e.target.value)}
                        >
                            <option value="">Metodo</option>
                            {metodoPag.map((metodo) => (
                                <option key={metodo} value={metodo}>
                                    {metodo}
                                </option>
                            ))}
                        </select>
                    </section>

                    <section>
                        <section id="box-desconto">
                            <span>Desconto:</span>
                            <section id="desconto">
                                <input
                                    value={descontoInput} // controlado pelo estado
                                    onChange={(e) => setDescontoInput(e.target.value)}
                                    placeholder="Insira o valor(R$ ou %)"></input>
                                <button
                                    onClick={() => aplicarDesconto(descontoInput)}
                                >Aplicar</button>
                            </section>
                        </section>
                    </section>

                </section>

                <section id="sales-btn-area">
                    <button onClick={() => finalizarVenda()}>
                        Finalizar Carrinho
                    </button>

                    <button>
                        Inserir débito
                    </button>

                    <button>
                        Cadastrar e gerir clientes
                    </button>

                    <button onClick={handleGoFinalizar}>
                        Finalizar dia
                    </button>

                </section>

            </div>
        </div>
    )
}