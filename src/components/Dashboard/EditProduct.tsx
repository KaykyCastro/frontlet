import { useState, useEffect } from "react"
import { EyeIcon, EyeClosedIcon } from "@phosphor-icons/react"
import Password from "../Password/Password"
import "./editproduct.css"
import { type Category, type Produto } from "../../types"

type EditProductProps = Produto & {
  onClick?: () => void;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditProduct({
  id,
  nome,
  code,
  preco,
  estoque,
  categoriaId,
  onClick,
  onClose,
  onUpdate
}: EditProductProps) {

  const [produtoId, setProdutoId] = useState()
  const [nameEdit, setNameEdit] = useState("")
  const [codeEdit, setCodeEdit] = useState("")
  const [priceEdit, setPriceEdit] = useState("")
  const [quantityEdit, setQuantityEdit] = useState("")
  const [categoryEdit, setCategoryEdit] = useState()
  const [category, setCategory] = useState<Category[]>([])
  const [showQuantity, setShowQuantity] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    buscarCategorias()
  }, [])

  async function buscarCategorias() {
    const response = await fetch("http://localhost:3000/categorias")
    const data = await response.json()
    setCategory(data)
  }

  useEffect(() => {
    setProdutoId(id || 0)
    setNameEdit(nome || "")
    setCodeEdit(code || "")
    setPriceEdit(String(preco ?? ""))
    setQuantityEdit(String(estoque ?? ""))
    setCategoryEdit(categoriaId || 0)
  }, [nome, code, preco, estoque, categoriaId])

  async function atualizarProduto() {

    const produtoAtualizado = {
      id: produtoId,
      nome: nameEdit,
      code: codeEdit,
      preco: priceEdit === "" ? 0 : Number(priceEdit),
      estoque: quantityEdit === "" ? 0 : Number(quantityEdit),
      categoriaId: Number(categoryEdit)
    }

    try {

      const response = await fetch(
        `http://localhost:3000/produtos/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(produtoAtualizado)
        }
      )

      onUpdate();

      const data = await response.json()

      console.log("Produto atualizado:", data)

      if (onClick) onClick()
      onClose()
    } catch (error) {
      console.error("Erro ao atualizar produto:", error)
    }
  }

  async function deleteProduct() {
    try {

      const response = await fetch(
        `http://localhost:3000/produtos/${id}`,
        {
          method: "DELETE"
        }
      )

      onUpdate()
      onClose()
      console.log(response)

    } catch (error) {
      console.error("Erro ao atualizar produto:", error)
    }
  }

  return (
    <div id="bg-edit" onClick={onClose}>

      {showPassword && (
        <Password
          onClose={() => setShowPassword(false)}
          onSuccess={() => {
            setShowQuantity(true)
            setShowPassword(false)
          }}
        />
      )}

      <div
        id="container-edit"
        onClick={(e) => e.stopPropagation()}
      >

        <button
          id="close-btn-edit"
          onClick={onClose}
        >
          ✕
        </button>

        <h1>Editar Produto</h1>

        <section>
          <label>Nome do produto:</label>
          <input
            value={nameEdit}
            onChange={(e) => setNameEdit(e.target.value)}
          />
        </section>

        <section>
          <label>Código do produto:</label>
          <input
            value={codeEdit}
            onChange={(e) => setCodeEdit(e.target.value)}
          />
        </section>

        <section>
          <label>Quantidade do produto:</label>
          <section id="quantity-section">
            <input
              id="quantity-input"
              type={showQuantity ? "number" : "password"}
              readOnly={!showQuantity}
              min={0}
              value={showQuantity ? quantityEdit : "000000000"}
              onChange={(e) => setQuantityEdit(e.target.value)}
            />

            {showQuantity ? (
              <button onClick={() => setShowQuantity(false)}>
                <EyeIcon size={20} />
              </button>
            ) : (
              <button onClick={() => setShowPassword(true)}>
                <EyeClosedIcon size={20} />
              </button>
            )}

          </section>
        </section>

        <section>
          <label>Valor do produto:</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={(priceEdit)}
            onChange={(e) => setPriceEdit(e.target.value)}
          />
        </section>

        <section>
          <label>Categoria do produto:</label>
          <select
            value={categoryEdit}
            onChange={(e) => setCategoryEdit(Number(e.target.value))}
          >
            <option value="">Categorias</option>

            {category.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}

          </select>
        </section>

        <section style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
          <button onClick={atualizarProduto}>Salvar</button>
          <button onClick={deleteProduct}>Deletar</button>
        </section>

      </div>
    </div>
  )
}