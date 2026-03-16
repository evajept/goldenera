import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import GoldenEra from './App.jsx'
import GoldenEraMobile from './GoldenEra-Mobile.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<GoldenEra />} />
      <Route path="/mobile" element={<GoldenEraMobile />} />
    </Routes>
  </BrowserRouter>
)
