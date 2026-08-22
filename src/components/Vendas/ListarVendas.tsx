import "./listavendas.css"

type ListaVenda = {
    venda: any
}

export default function ({ venda }: ListaVenda) {
    return (
        <div id="container-item">
            <p>Venda #{venda.id}</p>
            <section id="header">
                <span>Nome</span>
                <span>Qnt</span>
                <span>Valor</span>
            </section>
            <section id="lista-produtos">
                {venda?.itens.map((item) => {
                    // Preço de tabela atual do produto (pode ter mudado desde a venda,
                    // mas é a melhor referência que temos pra mostrar riscado).
                    const precoTabela = Number(item.produto?.preco)
                    const precoVendido = Number(item.preco)
                    const teveDesconto = !isNaN(precoTabela) && precoTabela !== precoVendido

                    return (
                        <div key={item.id} id="dados-produto">
                            <p style={{ width: "100px", wordWrap: "break-word" }}>{item.produto.nome}</p>
                            <p>{item.quantidade}</p>
                            <p>
                                {teveDesconto ? (
                                    <>
                                        <span style={{ textDecoration: "line-through", opacity: 0.6 }}>
                                            {precoTabela.toFixed(2)}
                                        </span>{" "}
                                        {precoVendido.toFixed(2)} R$
                                    </>
                                ) : (
                                    <>{precoVendido.toFixed(2)} R$</>
                                )}
                            </p>
                        </div>
                    )
                })}
            </section>

            <section id="footer-venda" style={{ borderTop: "1px solid #ccc", marginTop: "8px", paddingTop: "8px", textAlign: "right" }}>
                <p style={{ fontWeight: "bold" }}>
                    Total da venda: {Number(venda.total).toFixed(2)} R$
                </p>
            </section>
        </div>
    )
}