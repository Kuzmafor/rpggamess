import React, { useMemo, useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { Icon } from '../assets/Icon.jsx'
import { Sprite } from '../assets/sprites.jsx'
import { fmt } from '../utils/fmt.js'
import {
  listCodexEntries, codexTierOf, CODEX_TIERS, codexEntryBonus, getCodexBonuses,
} from '../data/codex.js'

const TIER_LABEL = {
  discovered: 'Открыт',
  briefing:   'Описан',
  studied:    'Изучен',
  mastered:   'Мастер',
}

export default function CodexPanel({ onClose }) {
  const kills = useGameStore(s => s.codexKills || {})
  const kinds = useGameStore(s => s.codexKinds || {})
  const [filter, setFilter] = useState('all')   // all | seen | mastered | unseen
  const [type, setType] = useState('all')       // all | common | boss
  const [active, setActive] = useState(null)
  const [tab, setTab] = useState('bestiary')    // bestiary | guides

  const entries = useMemo(() => listCodexEntries(), [])
  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (type === 'common' && e.kind !== 'common') return false
      if (type === 'boss' && e.kind !== 'boss') return false
      const k = kills[e.sprite] || 0
      if (filter === 'seen' && k <= 0) return false
      if (filter === 'unseen' && k > 0) return false
      if (filter === 'mastered' && k < CODEX_TIERS.mastered.kills) return false
      return true
    })
  }, [entries, kills, filter, type])

  const totalCount = entries.length
  const seenCount  = entries.filter(e => (kills[e.sprite] || 0) > 0).length
  const masteredCount = entries.filter(e => (kills[e.sprite] || 0) >= CODEX_TIERS.mastered.kills).length
  const bonus = useMemo(() => getCodexBonuses(kills, kinds), [kills, kinds])

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Энциклопедия</h2>
        <span className="panel-sub">{seenCount} / {totalCount} открыто · мастеров: {masteredCount}</span>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>

      <div className="raid-tabs">
        <button className={'raid-tab' + (tab === 'bestiary' ? ' active' : '')} onClick={() => setTab('bestiary')}>Бестиарий</button>
        <button className={'raid-tab' + (tab === 'guides' ? ' active' : '')} onClick={() => setTab('guides')}>Гайды</button>
      </div>

      {tab === 'guides' ? (
        <GuidesTab />
      ) : (
      <div className="codex-scroll">
        <div className="codex-bonus">
          <div className="codex-bonus-title">Глобальные пассивы от изучения</div>
          <div className="codex-bonus-list">
            {bonus.dmg  ? <span>Урон <b>+{(bonus.dmg * 100).toFixed(1)}%</b></span> : null}
            {bonus.gold ? <span>Золото <b>+{(bonus.gold * 100).toFixed(1)}%</b></span> : null}
            {bonus.ore  ? <span>Руда <b>+{(bonus.ore * 100).toFixed(1)}%</b></span> : null}
            {bonus.hp   ? <span>HP <b>+{(bonus.hp * 100).toFixed(1)}%</b></span> : null}
            {!bonus.dmg && !bonus.gold && !bonus.ore && !bonus.hp && (
              <span className="muted">Изучайте врагов, чтобы открыть бонусы.</span>
            )}
          </div>
        </div>

        <div className="filter-row" style={{ padding: 0 }}>
          <button className={'filter-btn' + (filter === 'all' ? ' active' : '')} onClick={() => setFilter('all')}>Все</button>
          <button className={'filter-btn' + (filter === 'seen' ? ' active' : '')} onClick={() => setFilter('seen')}>Виденные</button>
          <button className={'filter-btn' + (filter === 'unseen' ? ' active' : '')} onClick={() => setFilter('unseen')}>Не виденные</button>
          <button className={'filter-btn' + (filter === 'mastered' ? ' active' : '')} onClick={() => setFilter('mastered')}>Мастеры</button>
          <span style={{ flex: 1 }} />
          <button className={'filter-btn' + (type === 'all' ? ' active' : '')} onClick={() => setType('all')}>Любые</button>
          <button className={'filter-btn' + (type === 'common' ? ' active' : '')} onClick={() => setType('common')}>Враги</button>
          <button className={'filter-btn' + (type === 'boss' ? ' active' : '')} onClick={() => setType('boss')}>Боссы</button>
        </div>

        <div className="codex-grid">
          {filtered.map(e => {
            const k = kills[e.sprite] || 0
            const tier = codexTierOf(k)
            const seen = k > 0
            return (
              <button
                key={e.sprite}
                className={'codex-card' + (seen ? '' : ' unseen') + (e.kind === 'boss' ? ' is-boss' : '') + (tier ? ' tier-' + tier : '')}
                onClick={() => setActive(e)}
              >
                <div className="codex-card-art">
                  {seen ? (
                    <Sprite name={e.sprite} size={64} />
                  ) : (
                    <span className="codex-card-mask">?</span>
                  )}
                </div>
                <div className="codex-card-name">{seen ? e.name : '???'}</div>
                <div className="codex-card-meta">
                  {seen ? <span>×{k}</span> : <span className="muted">не встречен</span>}
                </div>
                {tier && <span className={'codex-card-tier tier-' + tier}>{TIER_LABEL[tier]}</span>}
              </button>
            )
          })}
        </div>
      </div>
      )}

      {active && (
        <CodexEntryModal
          entry={active}
          kills={kills[active.sprite] || 0}
          onClose={() => setActive(null)}
        />
      )}
    </section>
  )
}

/* ===================== Гайды ===================== */
function GuidesTab() {
  return (
    <div className="codex-scroll">
      {/* Начало игры — для новичков */}
      <div className="guide-card">
        <div className="guide-head">
          <span className="guide-ico">🚀</span>
          <div className="guide-title">С чего начать</div>
        </div>
        <p className="guide-text">
          Blade of Fate — это idle-RPG: герои бьют врагов автоматически, а вы помогаете
          тапами и управляете прокачкой. Главная цель — проходить зоны всё дальше.
        </p>
        <ol className="guide-steps">
          <li><b>Тапайте по врагу</b> — наносите урон и копите ярость.</li>
          <li><b>Нанимайте героев</b> (раздел «Герои») — они бьют сами и усиливают отряд.</li>
          <li><b>Качайте оружие и тап</b> (Магазин → Усиления, и «Оружие» → Эволюция).</li>
          <li><b>Открывайте сундуки</b> в Магазине, чтобы получать новых героев.</li>
          <li><b>Прогресс копится сам</b> — заходите забирать офлайн-награды.</li>
        </ol>
        <div className="guide-tip">
          Совет: застряли на зоне? Вернитесь на пройденные зоны фармить золото,
          прокачайте героев и оружие — и пробуйте снова.
        </div>
      </div>

      {/* Бой, ярость и супер */}
      <div className="guide-card">
        <div className="guide-head">
          <span className="guide-ico">⚡</span>
          <div className="guide-title">Бой, ярость и супер</div>
        </div>
        <p className="guide-text">
          Каждый тап и удар героя бьёт выбранного врага. Внизу копится шкала ярости —
          когда она полна, жмите «⚡» для мощного супер-удара по всей шеренге.
        </p>
        <p className="guide-text">
          Боссы появляются на 10-й волне зоны и дают гем. У некоторых есть фазы: щит,
          ярость или временная блокировка урона по роли — переключайте фокус и ждите,
          пока блок спадёт.
        </p>
      </div>

      {/* Прокачка героев */}
      <div className="guide-card">
        <div className="guide-head">
          <span className="guide-ico">🦸</span>
          <div className="guide-title">Прокачка героев</div>
        </div>
        <p className="guide-text">
          Уровень героя растёт за золото. Дубликаты из сундуков дают осколки и звёзды
          (ascension) — они кратно усиливают героя. С 50-го уровня открывается
          «Пробуждение» — выбор усиливающей ветки.
        </p>
        <p className="guide-text">
          В отряде до 5 героев. Сочетания ролей и стихий дают синергии — смотрите
          подсказку над отрядом. Меняйте состав под бой.
        </p>
      </div>

      {/* Валюты */}
      <div className="guide-card">
        <div className="guide-head">
          <span className="guide-ico">💰</span>
          <div className="guide-title">Валюты и ресурсы</div>
        </div>
        <ul className="guide-xp">
          <li><span className="dot d-boss" /><span className="lbl">Золото</span><b>прокачка</b></li>
          <li><span className="dot d-dgn" /><span className="lbl">Гемы</span><b>сундуки, бусты</b></li>
          <li><span className="dot d-mob" /><span className="lbl">Руда</span><b>заточка оружия</b></li>
          <li><span className="dot d-mob" /><span className="lbl">Осколки</span><b>артефакты</b></li>
        </ul>
        <p className="guide-text">
          Детали по каждому ресурсу — в «Инвентаре». Лишние гемы меняйте на
          золото/руду/осколки в Магазине → Обмен.
        </p>
      </div>

      {/* Куда дальше */}
      <div className="guide-card">
        <div className="guide-head">
          <span className="guide-ico">🗺️</span>
          <div className="guide-title">Режимы и что качать дальше</div>
        </div>
        <ul className="guide-xp">
          <li><span className="dot d-boss" /><span className="lbl">Рейды</span><b>материалы</b></li>
          <li><span className="dot d-dgn" /><span className="lbl">Подземелье</span><b>руда, осколки</b></li>
          <li><span className="dot d-mob" /><span className="lbl">Башня</span><b>частицы силы</b></li>
          <li><span className="dot d-dgn" /><span className="lbl">Экспедиции</span><b>idle-награды</b></li>
        </ul>
        <p className="guide-text">
          Не забывайте про Артефакты и Таланты («Прокачка») — это постоянные бонусы
          отряду. Город даёт пассивы и добычу руды даже офлайн, а в Кузнице города
          можно слить 3 одинаковых оружия в одно следующей редкости.
        </p>
        <div className="guide-tip">
          Совет: заходите каждый день за наградой в Календаре и забирайте подарки в
          Почте — там приходят промокоды и бонусы.
        </div>
      </div>

      {/* Battle Pass */}
      <div className="guide-card">
        <div className="guide-head">
          <span className="guide-ico">🏆</span>
          <div className="guide-title">Battle Pass — сезонный пропуск</div>
        </div>
        <p className="guide-text">
          Каждый сезон длится 30 дней и состоит из 30 уровней. Прокачивая уровни,
          вы получаете награды по двум трекам: бесплатному и премиум.
        </p>
        <div className="guide-sub">Как поднимать уровень</div>
        <p className="guide-text">
          Уровень растёт за накопленный опыт сезона (XP). XP начисляется за игру:
          убийства, рейды, подземелья и открытие сундуков. Чем выше уровень — тем
          больше XP нужно до следующего.
        </p>
        <div className="guide-sub">Где брать XP</div>
        <ul className="guide-xp">
          <li><span className="dot d-boss" /><span className="lbl">Босс зоны (волна 10)</span><b>+200 XP</b></li>
          <li><span className="dot d-mob"  /><span className="lbl">Любой враг</span><b>+10 XP</b></li>
          <li><span className="dot d-chest"/><span className="lbl">Открытие сундука</span><b>+80 XP</b></li>
          <li><span className="dot d-raid" /><span className="lbl">Прохождение рейда</span><b>+300 XP</b></li>
          <li><span className="dot d-dgn"  /><span className="lbl">Глава подземелья</span><b>+250 XP</b></li>
        </ul>
        <div className="guide-sub">Бесплатный и премиум</div>
        <p className="guide-text">
          Бесплатный трек доступен всем. Премиум открывается за алмазы и даёт более
          ценные награды на каждом уровне, а на 30-м — эксклюзивного героя сезона,
          которого нельзя получить из сундуков или купить в магазине.
        </p>
        <div className="guide-tip">
          Совет: рейды и подземелья дают больше всего XP — проходите их каждый день,
          пока действует сезон.
        </div>
      </div>

      {/* Бестиарий */}
      <div className="guide-card">
        <div className="guide-head">
          <span className="guide-ico">📖</span>
          <div className="guide-title">Бестиарий</div>
        </div>
        <p className="guide-text">
          Каждый убитый враг или босс попадает в энциклопедию. Чем больше убийств —
          тем выше уровень изучения: Открыт → Описан → Изучен → Мастер.
        </p>
        <p className="guide-text">
          На уровнях «Изучен» и «Мастер» враг даёт постоянный пассив всему отряду
          (урон, золото, руда). Эти бонусы складываются по всем изученным существам.
        </p>
      </div>

      {/* Снаряжение */}
      <div className="guide-card">
        <div className="guide-head">
          <span className="guide-ico">⚔️</span>
          <div className="guide-title">Снаряжение и герои</div>
        </div>
        <p className="guide-text">
          Снаряжение выпадает с боссов мира, рейдов, подземелий и из сундуков.
          Надевается индивидуально на героя в его карточке (раздел «Герои»).
          Урон, скорость, крит и ярость действуют только на того героя, на ком
          надета вещь; золото и HP — на весь отряд.
        </p>
        <p className="guide-text">
          Чем выше редкость героя, тем сильнее он становится при прокачке. Дешёвые
          обычные герои не обгоняют редких и легендарных при равной прокачке.
        </p>
      </div>
    </div>
  )
}

function CodexEntryModal({ entry, kills, onClose }) {
  const tier = codexTierOf(kills)
  const showLore  = kills >= CODEX_TIERS.briefing.kills
  const showDrops = kills >= CODEX_TIERS.briefing.kills
  const bonus = codexEntryBonus(entry.kind, kills)
  const nextTier = (() => {
    if (kills < CODEX_TIERS.discovered.kills) return CODEX_TIERS.discovered
    if (kills < CODEX_TIERS.briefing.kills)   return CODEX_TIERS.briefing
    if (kills < CODEX_TIERS.studied.kills)    return CODEX_TIERS.studied
    if (kills < CODEX_TIERS.mastered.kills)   return CODEX_TIERS.mastered
    return null
  })()

  return (
    <div className="reveal-overlay" onClick={onClose}>
      <div className={'codex-modal' + (entry.kind === 'boss' ? ' is-boss' : '')} onClick={(e) => e.stopPropagation()}>
        <button className="close-btn raid-info-close" onClick={onClose}><Icon name="close" size={16} /></button>
        <div className="codex-modal-art">
          {kills > 0 ? <Sprite name={entry.sprite} size={120} /> : <span className="codex-card-mask big">?</span>}
        </div>
        <div className="codex-modal-name">{kills > 0 ? entry.name : '???'}</div>
        <div className="codex-modal-meta">
          {entry.kind === 'boss' ? 'Босс зоны' : 'Обычный враг'} · убито: <b>{kills}</b>
          {tier && <> · <span className={'codex-tier-tag tier-' + tier}>{TIER_LABEL[tier]}</span></>}
        </div>

        {showLore && entry.desc && (
          <div className="codex-section">
            <div className="codex-section-title">Описание</div>
            <div className="codex-section-text">{entry.desc}</div>
          </div>
        )}
        {showDrops && entry.drops?.length > 0 && (
          <div className="codex-section">
            <div className="codex-section-title">Дроп</div>
            <ul className="codex-drops">
              {entry.drops.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </div>
        )}

        {bonus && (
          <div className="codex-section">
            <div className="codex-section-title">Текущий бонус</div>
            <div className="codex-section-text">
              {bonus.dmg ? <>Урон +{(bonus.dmg*100).toFixed(1)}% </> : null}
              {bonus.gold ? <>· Золото +{(bonus.gold*100).toFixed(1)}% </> : null}
              {bonus.ore ? <>· Руда +{(bonus.ore*100).toFixed(1)}% </> : null}
            </div>
          </div>
        )}

        {nextTier && (
          <div className="codex-section">
            <div className="codex-section-title">Следующий уровень</div>
            <div className="codex-section-text">
              {TIER_LABEL[nextTierKey(nextTier)]}: убей ещё <b>{nextTier.kills - kills}</b>
            </div>
          </div>
        )}

        <button className="btn ghost size-md block" onClick={onClose}>Закрыть</button>
      </div>
    </div>
  )
}

function nextTierKey(tierObj) {
  for (const [k, v] of Object.entries(CODEX_TIERS)) if (v === tierObj) return k
  return 'discovered'
}
