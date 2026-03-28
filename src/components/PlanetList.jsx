import { PLANET_DATA } from '../data/PlanetData'

const PLANETS = Object.keys(PLANET_DATA)

const infoStats = [
  { key: 'type', label: 'Class' },
  { key: 'diameter', label: 'Diameter' },
  { key: 'distFromSun', label: 'Dist. from Sun' },
  { key: 'orbitalPeriod', label: 'Orbital period' },
  { key: 'dayLength', label: 'Day length' },
  { key: 'moons', label: 'Moons' },
  { key: 'avgTemp', label: 'Avg. temperature' },
]

function InfoPanel({ planet, onClose }) {
  if (!planet) return null
  const data = PLANET_DATA[planet]

  return (
    <div className="info-panel">
      <button className="pl-back-btn" onClick={onClose}>
        ← BACK
      </button>

      <div className="pl-info-header">
        <div
          className="pl-info-dot"
          style={{
            background: data.color,
            boxShadow: `0 0 8px 2px ${data.color}`,
          }}
        />
        <span className="pl-info-title">{planet.toUpperCase()}</span>
      </div>

      <p
        className="pl-info-description"
        style={{ borderLeftColor: `${data.color}40` }}
      >
        {data.description}
      </p>

      <div>
        {infoStats.map(({ key, label }) => (
          <div key={key} className="info-row">
            <span className="info-label">{label}</span>
            <span className="info-value">{data[key]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PlanetList({ selectedPlanet, onSelectPlanet }) {
  const handleSelect = (name) => {
    onSelectPlanet(selectedPlanet === name ? null : name)
  }

  return (
    <>
      <div className="pl-sidebar">
        <div className="pl-sidebar-header">Solar System</div>

        {PLANETS.map((name) => {
          const { color, type } = PLANET_DATA[name]
          const active = selectedPlanet === name

          return (
            <div
              key={name}
              className={`pl-item${active ? ' active' : ''}`}
              onClick={() => handleSelect(name)}
            >
              <div
                className="pl-dot"
                style={{ background: color, color }}
              />
              <span className="pl-name">{name}</span>
              <span className="pl-type">{type.split(' ')[0]}</span>
            </div>
          )
        })}
      </div>

      {selectedPlanet && (
        <InfoPanel
          planet={selectedPlanet}
          onClose={() => onSelectPlanet(null)}
        />
      )}
    </>
  )
}