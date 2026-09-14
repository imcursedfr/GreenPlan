/**
 * ── Engineering assumptions & unit constants ──────────────────────────────
 *
 * Every number used by the deterministic engines lives here with its source
 * rationale, so results are auditable. Values are deliberately conservative
 * international defaults; a production version would regionalize them.
 */

/** Currency used across all cost/savings figures. */
export const CURRENCY = 'USD'

// ── General ────────────────────────────────────────────────────────────────

/** kg CO₂ per kWh of grid electricity (world-average grid intensity). */
export const GRID_CARBON_INTENSITY_KG_PER_KWH = 0.45

// ── Solar ─────────────────────────────────────────────────────────────────

export const SOLAR = {
  /** Usable share of roof area after setbacks/obstructions. */
  ROOF_FILL_RATIO: 0.7,
  /** Modern ~440 Wp panels: ≈ 0.208 kWp per m² of panel. */
  PANEL_EFFICIENCY_KWP_PER_SQM: 0.208,
  /** PV cell temperature/derate losses. */
  SYSTEM_LOSSES: 0.85,
  /** Installed cost per kWp (residential, turnkey). */
  COST_PER_KWP: 1400,
  /** O&M per kWp per year, subtracted from savings. */
  ANNUAL_OM_PER_KWP: 14,
  /** Panel degradation — year-1 average output factor over 25y. */
  ANNUAL_DEGRADATION_FACTOR: 0.99,
  /** Share of generation consumed on-site (rest exported cheaply). */
  SELF_CONSUMPTION: 0.7,
  /** Export tariff per kWh for the non-self-consumed share. */
  EXPORT_TARIFF: 0.05,
  /** Peak-sun-hours per day by climate zone (annual average). */
  PEAK_SUN_HOURS: {
    tropical: 4.8,
    arid: 5.5,
    temperate: 3.8,
    continental: 3.4,
    polar: 2.2,
  } as const,
  /** Extra yield factor by orientation (1.0 = optimal south equator-facing). */
  ORIENTATION_FACTOR: {
    south: 1,
    southeast: 0.95,
    southwest: 0.95,
    east: 0.85,
    west: 0.85,
    north: 0.7,
    flat: 0.9,
    unknown: 0.88,
  } as const,
  /** kg CO₂ avoided per kWh generated (displaced grid electricity). */
  CO2_PER_KWH: 0.45,
} as const

// ── Water ──────────────────────────────────────────────────────────────────

export const WATER = {
  /** Annual rainfall mm/year by climate zone. */
  ANNUAL_RAINFALL_MM: {
    tropical: 1800,
    arid: 250,
    temperate: 800,
    continental: 650,
    polar: 400,
  } as const,
  /** Share of rainfall actually captured from the roof. */
  RUNOFF_COEFFICIENT: 0.85,
  /** Share of captured water usable after first-flush/filter losses. */
  USABLE_FRACTION: 0.9,
  /** Buffer days of storage recommended for dry spells. */
  STORAGE_BUFFER_DAYS: 14,
  /** Storage tank cost per 1000 L installed. */
  TANK_COST_PER_1000L: 220,
  /** Pump/filter/diverter fixed cost. */
  SYSTEM_FIXED_COST: 450,
  /** Municipal water price per m³. */
  WATER_TARIFF_PER_M3: 2.5,
} as const

// ── Efficiency ────────────────────────────────────────────────────────────

export const EFFICIENCY = {
  /** Baseline annual electricity per m² by climate zone (kWh/m²/yr). */
  BASELINE_KWH_PER_SQM: {
    tropical: 140,
    arid: 120,
    temperate: 100,
    continental: 120,
    polar: 180,
  } as const,
  /** Additional baseline multiplier for heavy AC usage. */
  COOLING_MULTIPLIER: { none: 1, low: 1.05, moderate: 1.2, high: 1.4 } as const,
  /** Savings as share of baseline by measure (applied once, first-match order). */
  MEASURE_SAVINGS_SHARE: {
    atticInsulation: 0.12,
    doubleGlazing: 0.1,
    smartThermostat: 0.07,
    ledLighting: 0.03,
    efficientAc: 0.15,
  } as const,
  /** Cost per measure (whole-home, USD). */
  MEASURE_COSTS: {
    atticInsulation: 2400,
    doubleGlazing: 5200,
    smartThermostat: 250,
    ledLighting: 300,
    efficientAc: 4200,
  } as const,
  /** Fixed effect per degree of thermostat setpoint adjustment. */
  SETBACK_SHARE: 0.05,
  /** Cost to improve AC by one SEER-ish efficiency tier. */
  AC_UPGRADE_COST: 4200,
} as const

// ── Waste ─────────────────────────────────────────────────────────────────

export const WASTE = {
  /** Annual municipal waste per household member (kg). */
  WASTE_PER_CAPITA_KG: 440,
  /** Diverted share by measure. */
  DIVERSION_SHARE: {
    recyclingProgram: 0.25,
    composting: 0.3,
  } as const,
  /** kg CO₂e avoided per kg diverted from landfill. */
  LANDFILL_CO2_PER_KG: 0.58,
  /** Compost bin cost. */
  COMPOST_BIN_COST: 120,
} as const
