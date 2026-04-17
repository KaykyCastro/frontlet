import './App.css'
import { Routes, Route } from 'react-router-dom'
import Main from './components/Main'
import { Layout } from './components/Layout'
import Dashboard from './components/Dashboard/Dashboard'
import Sales from './components/Vendas/Sales'
import NotaFiscal from './components/Vendas/NotaFiscal'
import FinalizarDia from './components/Vendas/FinalizarDia'

function App() {
  

  return (
    <Routes>
      <Route element={<Layout/>}>
      <Route path='/' element={<Main/>}/>
      <Route path='/Dashboard' element={<Dashboard/>}/>
      <Route path='/Vendas' element={<Sales/>}/>
      <Route path='/Nota' element={<NotaFiscal/>}/>
      <Route path='/Finalizar' element={<FinalizarDia/>}/>
      </Route>
    </Routes>
  )
}

export default App
