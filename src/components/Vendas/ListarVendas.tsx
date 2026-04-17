import "./listavendas.css"

type ListaVenda = {
    venda: any
}

export default function ({venda} : ListaVenda) {
    return (
        <div id="container-item">
            <p>Venda #{venda.id}</p>

             <section id="header">
                        <span>Nome</span>
                        <span>Qnt</span>
                        <span>Valor</span>
                    </section>

            <section id="lista-produtos">
                {venda?.itens.map((item) => (
            <div key={item.id} id="dados-produto">
              <p style={{width: "100px", wordWrap: "break-word"}}>{item.produto.nome}</p>
              <p>{item.quantidade}</p>
              <p>{item.preco.toFixed(2)} R$</p>
            </div>
          ))}
            </section>
            
        </div>
    )
}