import "./productlist.css"
import { type Produto } from "../../types"

type List = Produto & {
    onClick?: () => void;
    selected: boolean;
}

export default function ProductList({ nome, code, preco, desconto, precoComDesconto, estoque, onClick, selected }: List) {
    const status = estoque > 0

    return (
        <div id={selected ? "container-product-active" : "container-product"} onClick={onClick}>
            <div id="data-product">
                <div className="information-text">
                    <span>Nome: <span className="data">{nome}</span></span>
                    <span>Código: <span className="data">{code}</span></span>
                </div>
                <div className="information-text">
                    <span>
                        Preço:{" "}
                        {precoComDesconto ? (
                            <>
                                <span className="data" style={{ textDecoration: "line-through", opacity: 0.6 }}>
                                    {preco.toFixed(2)}
                                </span>{" "}
                                <span className="data" id="discount-price">
                                    {precoComDesconto.toFixed(2)} ({desconto}% off)
                                </span>
                            </>
                        ) : (
                            <span className="data">{preco.toFixed(2)}</span>
                        )}
                    </span>
                    <span>
                        Status:
                        {status
                            ? <span id="in-stock"> Em estoque</span>
                            : <span id="out-stock"> Fora de estoque</span>
                        }
                    </span>
                </div>
            </div>
        </div>
    )
}