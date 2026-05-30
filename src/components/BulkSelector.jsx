import React from 'react'

/**
 * Компактный селектор множителя покупки: x1 / x10 / x100 / Max.
 */
export default function BulkSelector({ value, onChange, options = [1, 10, 100, 'max'] }) {
  return (
    <div className="bulk-selector" role="tablist" aria-label="Множитель покупки">
      {options.map(opt => (
        <button
          key={opt}
          className={'bulk-opt' + (opt === value ? ' on' : '')}
          onClick={() => onChange(opt)}
        >
          {opt === 'max' ? 'Max' : 'x' + opt}
        </button>
      ))}
    </div>
  )
}
