import React, { useCallback, useEffect, useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'

export default function Toasts() {
  const [items, setItems] = useState([])
  const setToaster = useGameStore(s => s.setToaster)

  const push = useCallback((msg) => {
    const id = Math.random().toString(36).slice(2)
    setItems(prev => [...prev, { id, msg }])
    setTimeout(() => setItems(prev => prev.filter(i => i.id !== id)), 3500)
  }, [])

  useEffect(() => {
    setToaster(push)
    if (typeof window !== 'undefined') window.__bofToast = push
  }, [push, setToaster])

  return (
    <div className="toasts">
      {items.map(i => <div key={i.id} className="toast">{i.msg}</div>)}
    </div>
  )
}
