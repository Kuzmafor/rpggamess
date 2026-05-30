import React from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { Icon } from '../assets/Icon.jsx'
import { fmt } from '../utils/fmt.js'
import PetArt from '../assets/PetArt.jsx'
import {
  PETS, PET_RARITIES, PET_RARITY_INFO, getPet, petUpgradeCost,
  PET_MAX_LEVEL, describePetAffix, getActivePetBonuses,
} from '../data/pets.js'

const RARITY_ORDER = { legendary: 0, epic: 1, rare: 2, common: 3 }

export default function PetsPanel({ onClose }) {
  const pets = useGameStore(s => s.pets || {})
  const eggs = useGameStore(s => s.petEggs || 0)
  const activePet = useGameStore(s => s.activePet)
  const gold = useGameStore(s => s.gold)
  const hatch = useGameStore(s => s.hatchEgg)
  const setActive = useGameStore(s => s.setActivePet)
  const upgrade = useGameStore(s => s.upgradePet)

  const owned = Object.keys(pets)
  // Сортируем все виды: владеемые сверху, по редкости
  const list = [...PETS].sort((a, b) => {
    const ao = pets[a.id] ? 0 : 1
    const bo = pets[b.id] ? 0 : 1
    if (ao !== bo) return ao - bo
    return (RARITY_ORDER[a.rarity] ?? 9) - (RARITY_ORDER[b.rarity] ?? 9)
  })

  const activeBonuses = activePet
    ? getActivePetBonuses({ id: activePet, level: pets[activePet]?.level || 1 })
    : null

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Питомцы</h2>
        <span className="panel-sub">Собрано: {owned.length} / {PETS.length}</span>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>

      <div className="pets-scroll">
        {/* Яйца */}
        <div className="pets-egg-card">
          <div className="pets-egg-art">🥚</div>
          <div className="pets-egg-meta">
            <div className="pets-egg-title">Яйца питомцев</div>
            <div className="pets-egg-sub">
              Выпадают из ивент-боссов и дорогих сундуков. Вылупи, чтобы получить
              случайного спутника.
            </div>
          </div>
          <button
            className="btn neon size-md"
            disabled={eggs <= 0}
            onClick={() => hatch()}
          >
            Вылупить ({eggs})
          </button>
        </div>

        {/* Активный питомец — сводка */}
        {activePet && (
          <div className="pets-active">
            <div className="pets-active-art">
              <PetArt art={getPet(activePet)?.art} size={64} />
            </div>
            <div className="pets-active-meta">
              <div className="pets-active-name">
                {getPet(activePet)?.name}
                <span className="pets-active-tag">активен</span>
              </div>
              <div className="pets-active-bonus">
                {getPet(activePet)?.affixes.map(af => (
                  <span key={af}>{describePetAffix(getPet(activePet).rarity, af, pets[activePet]?.level || 1)}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Коллекция */}
        <div className="pets-grid">
          {list.map(p => {
            const inst = pets[p.id]
            const have = !!inst
            const isActive = activePet === p.id
            const rar = PET_RARITY_INFO[p.rarity]
            const cost = have ? petUpgradeCost(p.rarity, inst.level) : 0
            const maxed = have && inst.level >= PET_MAX_LEVEL
            return (
              <div
                key={p.id}
                className={'pet-card rar-' + p.rarity + (have ? '' : ' locked') + (isActive ? ' active' : '')}
                style={{ '--ac': rar.color }}
              >
                <div className="pet-card-art">
                  {have ? <PetArt art={p.art} size={72} /> : <span className="pet-mask">?</span>}
                </div>
                <div className="pet-card-name">{have ? p.name : '???'}</div>
                <div className={'pet-card-rar rar-' + p.rarity}>{rar.label}</div>
                {have ? (
                  <>
                    <div className="pet-card-lvl">ур. {inst.level}{maxed ? ' · макс' : ''}</div>
                    <div className="pet-card-affixes">
                      {p.affixes.map(af => (
                        <span key={af}>{describePetAffix(p.rarity, af, inst.level)}</span>
                      ))}
                    </div>
                    <div className="pet-card-actions">
                      <button
                        className={'btn size-sm ' + (isActive ? 'ghost' : 'neon')}
                        disabled={isActive}
                        onClick={() => setActive(p.id)}
                      >
                        {isActive ? 'Активен' : 'Выбрать'}
                      </button>
                      <button
                        className="btn gold size-sm"
                        disabled={maxed || gold < cost}
                        onClick={() => upgrade(p.id)}
                      >
                        {maxed ? 'Макс' : <><Icon name="gold" size={12} /> {fmt(cost)}</>}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="pet-card-locked">Не пойман</div>
                )}
              </div>
            )
          })}
        </div>

        <div className="hint">
          Активным может быть один питомец — его бонусы действуют на весь отряд.
          Дубликаты повышают уровень питомца.
        </div>
      </div>
    </section>
  )
}
