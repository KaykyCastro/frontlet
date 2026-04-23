import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./finalizar.css"
import { type Venda } from "../../types";
import ListarVendas from "./ListarVendas";

export default function FinalizarDia() {

    const [vendas, setVendas] = useState<Venda[]>([])
    const [total, setTotal] = useState<number>()
    const [totaisPorTipo, setTotaisPorTipo] = useState<Record<string, number>>()
    const navigate = useNavigate()

    useEffect(() => {
        buscarVendas()
    }, [])

    useEffect(() => {
        const total = vendas.reduce((acc, venda) => {
            return acc + Number(venda.total);
        }, 0);
        setTotal(total);
    }, [vendas])

    useEffect(() => {
        const resultadoPorTipo = vendas.reduce((acc, venda) => {
            const tipo = venda.metodo;
            const valor = Number(venda.total);

            acc[tipo] = (acc[tipo] || 0) + valor;

            return acc;
        }, {} as Record<string, number>);

        setTotaisPorTipo(resultadoPorTipo);
    }, [vendas]);

    function handleGoBack () {
        navigate("/Vendas")
    }

    async function buscarVendas() {
        const response = await fetch(`http://localhost:3000/vendas/dia`)
        const data = await response.json();

        setVendas(data)
    }

    return (
        <div id="container-fin">
        <div id="container-div">
            <div id="container-metricas">
                <section id="metricas-section">
                    <section>
                        <h1>Métricas do dia</h1>
                    </section>

                    <section>
                        <p style={{ marginBottom: "20px", fontWeight: "bold" }}>Valores por tipo de pagamento:</p>
                        <section style={{ fontSize: "16px", gap: "10px" }}>
                            <p>-Pix: {(totaisPorTipo?.PIX || 0).toFixed(2)} R$</p>
                            <p>-Dinheiro: {(totaisPorTipo?.DINHEIRO || 0).toFixed(2)} R$</p>
                            <p>-Débito: {(totaisPorTipo?.CARTAO_DEBITO || 0).toFixed(2)} R$</p>
                            <p>-Crédito: {(totaisPorTipo?.CARTAO_CREDITO || 0).toFixed(2)} R$</p>
                        </section>
                    </section>

                    <section style={{ borderTop: "1px solid black", width: "90%" }}>
                        <p style={{ fontSize: "20px", fontWeight: "bold", marginTop: "10px" }}>Total: {total} R$</p>
                    </section>
                </section>
            </div>

            <div id="container-list">
                <h1>Itens vendidos</h1>
                <section id="lista-itens">
                    {vendas.map((venda) => (
                        <ListarVendas
                            venda={venda}
                        />
                    ))}

                </section>
            </div>
        </div>

            <button id="btn-fin" onClick={handleGoBack}>Finalizar</button>

        </div>
    )
}

