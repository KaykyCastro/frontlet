import "./productlist.css"
import { type Produto } from "../../types"

type ProductList = Produto & {
    onClick: () => void
}

export default function ProductList({ nome, code , preco, estoque, onClick } : ProductList) {

    const status = estoque > 0

    return (
        <div id="container-product" onClick={onClick}>

            <div id="data-product">
                <div className="information-text">
                    <span>Nome: <span className="data">{nome}</span></span>
                    <span>Código: <span className="data">{code}</span></span>
                </div>
                
                <div className="information-text">
                    <span>Preço: <span className="data">{preco}</span></span>
                    
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