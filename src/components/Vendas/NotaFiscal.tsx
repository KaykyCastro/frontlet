import { useRef, useEffect, useState } from "react";
import logo from "../../assets/logo.png"
import { XIcon } from "@phosphor-icons/react";
import "./nota.css"
import { type Note } from "../../types";

type FiscalProps = Note & {
  onClose?: () => void
}

export default function NotaFiscal({ cliente, itens, totalItens, totalFinal, desconto, data, onClose }: FiscalProps) {

  const [logoBase64, setLogoBase64] = useState("");

  useEffect(() => {
    toBase64(logo).then(setLogoBase64);
  }, []);

  const notaRef = useRef<HTMLDivElement>(null);

  const toBase64 = async (url: string) => {
    const response = await fetch(url);
    const blob = await response.blob();

    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  const handlePrint = () => {
    window.print();
  }

  const handleClose = () => {
    onClose()
  }


  return (
    <div id="bg-nota">
      <div id="container-fiscal">
          
        <section id="nota-header">
          <button id="btn-close" onClick={handleClose}>
            <XIcon size={16} weight="bold" color="black"></XIcon>
          </button>
        </section>

        <div id="container-nota" ref={notaRef}>

          <section id="empresa-data-fiscal">

            <img src={logoBase64} alt="logo"
              onLoad={() => console.log("logo carregado")} />
            <h4>Let Presentes</h4>
            <p>Av. Bulevar I, 291 - Jangurussu, Fortaleza - CE, 60866-280. CNPJ: 32.750.913.0001-11</p>
          </section>

          {cliente ?
            <>
              <hr></hr>

              <section id="cliente-data-fiscal">
                <h4>Cliente</h4>
                <p>
                  <span>Nome:</span>
                  <span className="data">{cliente?.nome}</span>
                </p>

                <p>
                  <span>CPF/CNPJ:</span>
                  <span className="data">{cliente?.cpf}</span>
                </p>

                <p>
                  <span>Endereço:</span>
                  <span className="data">{cliente?.endereco}</span>
                </p>
              </section>
            </>
            :
            <></>
          }

          <hr></hr>

          <section id="cupom">
            <h3>Cupom</h3>
            <section id="header-itens">
              <p>Produto</p>
              <p>Qnt</p>
              <p>Valor</p>
              <p>Total</p>
            </section>

            <section>
              {itens?.map((item) => (
                <div
                  id="body-itens"
                >
                  <p id="name-item">{item.nome}</p>
                  <p>{item.quantidade}x</p>
                  <p>{item.preco.toFixed(2)}</p>
                  <p>{(item.preco * item.quantidade).toFixed(2)}</p>
                </div>
              ))}
            </section>
          </section>


          <hr />
          <div id="data-finish">
            <p style={{ fontSize: "10px" }}>Data da compra: {data}</p>
            <p style={{ fontSize: "10px" }}>Total Itens: {totalItens}</p>
            <p style={{ fontSize: "12px", fontWeight: "bold" }}>Desconto: {desconto?.toFixed(2)}</p>
            <h3 style={{ fontSize: "14px" }}>Total Final: R$ {totalFinal?.toFixed(2)}</h3>
          </div>

        </div>

        <button id="btn-imprimir" onClick={handlePrint}>
          Imprimir Nota Fiscal
        </button>
      </div>
    </div>
  );
}