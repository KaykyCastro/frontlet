import { useRef, useEffect, useState } from "react";
import logo from "../../assets/logo.png"
import { XIcon } from "@phosphor-icons/react";
import { type Note } from "../../types";
import qz from "qz-tray"
import { initQZ } from "./services/qzServices";
import "./nota.css"

type FiscalProps = Note & {
  totalSemDesconto: number
  onClose?: () => void
}

export default function NotaFiscal({ cliente, itens, totalItens, totalSemDesconto, totalFinal, desconto, data, onClose }: FiscalProps) {

  const [logoBase64, setLogoBase64] = useState("");

  useEffect(() => {
    toBase64(logo).then(setLogoBase64);
  }, []);

  useEffect(() => {
    initQZ().catch(console.error)
  }, [])

  const resizeImage = async (
    base64: string,
    width: number
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = 140;

        const ctx = canvas.getContext("2d");

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/png"));
      };

      img.src = base64;
    });
  };

  const imprimirCupom = async () => {
    try {
      await initQZ();

      const config = qz.configs.create("i9");

      // REDUZ A LOGO
      const smallLogo = await resizeImage(logoBase64, 180);

      const linha = "-".repeat(60);

      // FUNÇÃO PARA QUEBRAR TEXTO
      const quebrarTexto = (texto, tamanho) => {
        const palavras = texto.split(" ");
        const linhas = [];

        let linhaAtual = "";

        for (const palavra of palavras) {
          if ((linhaAtual + palavra).length > tamanho) {
            linhas.push(linhaAtual.trim());
            linhaAtual = palavra + " ";
          } else {
            linhaAtual += palavra + " ";
          }
        }

        if (linhaAtual) {
          linhas.push(linhaAtual.trim());
        }

        return linhas;
      };

      // FORMATAR ITENS
      const itensTexto = itens.map((item) => {
        // TAMANHO MÁXIMO DO NOME
        const linhasNome = quebrarTexto(item.nome, 28);

        const qtd = `${item.quantidade}x`.padStart(6, " ");

        // VERIFICA SE TEM DESCONTO NO ITEM
        const temDesconto =
          item.precoOriginal !== undefined &&
          item.precoOriginal !== item.preco;

        // SE TIVER DESCONTO, MOSTRA OS DOIS VALORES SEM SETA
        // (impressora térmica não suporta tachado de forma universal via ESC/POS,
        // então aqui vão os dois preços lado a lado)
        const valor = temDesconto
          ? `${item.precoOriginal.toFixed(2)} ${item.preco.toFixed(2)}`.padStart(10, " ")
          : item.preco.toFixed(2).padStart(10, " ");

        const total = (item.preco * item.quantidade)
          .toFixed(2)
          .padStart(10, " ");

        let texto = "";

        linhasNome.forEach((linhaNome, index) => {
          // PRIMEIRA LINHA MOSTRA TUDO
          if (index === 0) {
            texto +=
              linhaNome.padEnd(34, " ") +
              qtd +
              valor +
              total +
              "\n";
          } else {
            // RESTANTE MOSTRA SÓ O NOME
            texto += linhaNome + "\n";
          }
        });

        return texto;
      });

      const cupom = [
        // RESET
        "\x1B\x40",

        // FONTE MENOR
        "\x1BM\x01",

        // TEXTO COMPACTO
        "\x1B!\x01",

        // CENTRALIZAR
        "\x1B\x61\x31",

        // LOGO
        {
          type: "raw",
          format: "image",
          data: smallLogo,
          options: {
            language: "ESCPOS",
            dotDensity: "single",
          },
        },

        "\n",

        // EMPRESA
        "\x1B\x45\x01",
        "LET PRESENTES\n",
        "\x1B\x45\x00",

        "Av. Bulevar I, 291",
        "Jangurussu - Fortaleza/CE\n",
        "CEP: 60866-280",
        "CNPJ: 32.750.913.0001-11\n",

        "\n",

        `Data: ${data}\n`,

        "\n",

        linha + "\n",

        // CLIENTE
        cliente
          ? [
            "\x1B\x61\x30",

            "\x1B\x45\x01",
            "CLIENTE\n",
            "\x1B\x45\x00",

            "\n",

            `Nome: ${cliente.nome}\n`,
            `CPF/CNPJ: ${cliente.cpf}\n`,
            `Endereco: ${cliente.endereco}\n`,
            cliente.divida !== undefined ? `Divida atual: R$ ${Number(cliente.divida).toFixed(2)}\n` : "",

            "\n",

            linha + "\n",
          ]
          : [],
        // TITULO
        "\x1B\x61\x31",

        "\x1B\x45\x01",
        "RECIBO FISCAL\n",
        "\x1B\x45\x00",

        "\n",

        // ITENS
        "\x1B\x61\x00",

        "PRODUTO                                QTD    VALOR    TOTAL\n",

        linha + "\n",

        ...itensTexto,

        linha + "\n",

        "\n",

        `Total itens: ${totalItens}\n`,
        `Valor Total: R$ ${totalSemDesconto.toFixed(2)}\n`,
        `Desconto: R$ ${desconto?.toFixed(2)}\n`,

        "\n",

        linha + "\n",

        // TOTAL DESTACADO
        "\x1B\x61\x31",

        "\x1D\x21\x11",

        `A PAGAR: R$ ${totalFinal?.toFixed(2)}\n`,

        "\x1D\x21\x00",


        "\n\n",

        "Obrigado pela preferenciar e volte sempre!\n",

        "\n\n\n\n",

        // CORTE
        "\x1D\x56\x41\x03",
      ].flat();

      await qz.print(config, cupom);

      console.log("Impresso com sucesso");
    } catch (err) {
      console.error(err);
    }
  };
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

                {cliente?.divida !== undefined && (
                  <p>
                    <span>Dívida atual:</span>
                    <span className="data">R$ {Number(cliente.divida).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </p>
                )}
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
                <div id="body-itens" key={item.id}>
                  <p id="name-item">{item.nome}</p>
                  <p>{item.quantidade}x</p>
                  <p>
                    {item.precoOriginal && item.precoOriginal !== item.preco
                      ? (
                        <>
                          <s>{item.precoOriginal.toFixed(2)}</s> {item.preco.toFixed(2)}
                        </>
                      )
                      : item.preco.toFixed(2)}
                  </p>
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

        <button id="btn-imprimir" onClick={imprimirCupom}>
          Imprimir Nota Fiscal
        </button>
      </div>
    </div>
  );
}