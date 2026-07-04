export type Produto = {
    id : number,
    nome : string,
    preco : number,
    desconto? : number | null,
    precoComDesconto? : number | null,
    estoque : number,
    code? : string
    categoriaId? : number
}

export type CartItem = Omit<Produto, 'categoriaId'> & {
    quantidade: number
    preco: number         
    precoOriginal?: number
};

export type Note = {
    cliente?: User;
    itens?: CartItem[];
    totalItens?: number;
    totalFinal?: number;
    desconto? : number;
    data?: string;
};

export type User = {
    id : number,
    nome : string, 
    cpf : string,
    endereco: string,
    divida : number,
}

export type Category = {
    id : number,
    nome : string,
}

export type ItemVenda = {
    preco: number,
    produtoId: number,
    quantidade: number,
    vendaId: number 
}

export type Venda = {
    data: string,
    metodo: string,
    total: number,
    userId?: number,
    itens: ItemVenda
}